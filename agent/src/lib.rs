pub mod config;
pub mod message;
mod connection;
mod handler;

use std::sync::Arc;
use tokio::sync::broadcast;
use crate::connection::Connection;
use crate::handler::Handler;
use crate::message::RequestMessage;

pub async fn run(shutdown_rx:broadcast::Receiver<bool>, config: config::Config) -> anyhow::Result<()>{

    let config = Arc::new(config);
    //todo: 优化 Message clone 问题。 或是替换队列
    let (cmd_tx, cmd_rx) = broadcast::channel::<(String, RequestMessage)>(5);

    let (connection, event_loop) = Connection::connect(config.clone()).await?;
    let mut handler = Handler::new(cmd_rx, connection, config.get_response_command_topic());
    let shutdown_rx_1 = shutdown_rx.resubscribe();

    tokio::spawn(async move {
        handler.run(shutdown_rx_1).await;
    });
    Connection::loop_event(event_loop, shutdown_rx, cmd_tx).await;
    Ok(())
}
