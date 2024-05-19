mod config;
mod connection;
mod handler;

use anyhow::Context;
use clap::{Parser, ArgGroup};
use std::path::PathBuf;
use std::sync::Arc;
use tokio::{signal, sync::broadcast};
use tracing_subscriber::EnvFilter;
use crate::connection::Connection;
use crate::handler::{Handler, RequestMessage};

#[derive(Parser, Debug)]
#[clap(name = crate::config::APP_NAME, version = env!("CARGO_PKG_VERSION"))]
#[clap(group(ArgGroup::new("cmds").required(true).args(&["CONFIG"]),))]
struct Cli {
    #[clap(value_parser, name = "CONFIG")]
    pub config_path: Option<PathBuf>,
}


#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let ops = Cli::parse();

    let (shutdown_tx, shutdown_rx) = broadcast::channel::<bool>(1);
    tokio::spawn(async move {
        if let Err(e) = signal::ctrl_c().await {
            // Something really weird happened. So just panic
            panic!("Failed to listen for the ctrl-c signal: {:?}", e);
        }

        if let Err(e) = shutdown_tx.send(true) {
            // shutdown signal must be catched and handle properly
            // `rx` must not be dropped
            panic!("Failed to send shutdown signal: {:?}", e);
        }
    });

    let is_atty = atty::is(atty::Stream::Stdout);

    tracing_subscriber::fmt().with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::from("info")),)
        .with_ansi(is_atty).init();

    let config = config::Config::new(ops.config_path).with_context(|| "Config can not load")?;

    run(shutdown_rx, config).await?;
    Ok(())
}


async fn run(shutdown_rx:broadcast::Receiver<bool>, config: config::Config) -> anyhow::Result<()>{

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

#[cfg(test)]
mod test {
    use clap::Parser;
    use crate::Cli;
    use crate::config::APP_NAME;

    #[test]
    fn parse_cli() {
        let result = Cli::parse_from([APP_NAME, "config.yaml"]);
        println!("{:?}", result);
        let result = Cli::parse_from([APP_NAME, "--version"]);
        println!("{:?}", result);
        let result = Cli::parse_from([APP_NAME, "--help"]);
        println!("{:?}", result);
    }
}