use std::env;
use std::io::IsTerminal;
use std::path::PathBuf;
use anyhow::bail;
use clap::Parser;
use rumqttc::v5::{AsyncClient, MqttOptions, Incoming};
use rumqttc::v5::mqttbytes::QoS;
use tracing_subscriber::EnvFilter;
use mproxy::message::{RequestMessage, ResponseMessage};
use mproxy::config::CTRL_APP_NAME;


#[derive(Parser, Debug)]
#[clap(name = CTRL_APP_NAME, version = env!("CARGO_PKG_VERSION"))]
struct Cli {
    #[arg(short, long, value_name = "FILE")]
    pub config: Option<PathBuf>,
    pub command: Vec<String>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();
    if cli.command.is_empty() {
        bail!("no command could be sent to MQTT");
    }
    let command = cli.command.join(" ");

    let is_terminal = std::io::stdout().is_terminal();

    tracing_subscriber::fmt().with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::from("debug")),)
        .with_ansi(is_terminal).init();

    let config = mproxy::config::CtrlConfig::new(cli.config).unwrap();

    let mqtt_url = format!("{}?client_id={}", &config.server, &config.client_id);
    let mut options = MqttOptions::parse_url(&mqtt_url).unwrap();
    if matches!(config.username, Some(_)) && matches!(config.password, Some(_)) {
        options.set_credentials(config.username.clone().unwrap(), config.password.clone().unwrap());
    }
    let (client, mut eventloop) = AsyncClient::new(options,20);

    let topic = config.get_subscribe_command_topic();
    client.subscribe(topic, QoS::ExactlyOnce).await?;

    tokio::spawn(async move {
        loop {
            let event = eventloop.poll().await;
            match event {
                Ok(event) =>  {
                    match event {
                        rumqttc::v5::Event::Incoming(Incoming::Publish(data)) => {
                            let resp: ResponseMessage = serde_json::from_slice(data.payload.as_ref()).unwrap();

                            match resp {
                                ResponseMessage::Ok {data, seq, pid, ..} => println!("[{pid}][{seq}] {data}"),
                                ResponseMessage::Err {message,..} => eprintln!("{message}"),
                            }
                        }
                        _ => ()
                    }
                },
                Err(err) => eprintln!("{:?}", err),
            };
        }
    });
    let command = RequestMessage::Cmd{command: command.to_string(), request_id: "test_request_id".to_string()};
    let command = serde_json::to_vec(&command).unwrap();
    client.publish(config.get_publish_command_topic(), QoS::ExactlyOnce, false, command).await?;
    tokio::signal::ctrl_c().await?;

    Ok(())
}

#[cfg(test)]
mod test{

    use clap::Parser;
    use crate::Cli;

    const APP_NAME:&str = mproxy::config::CTRL_APP_NAME;
    #[test]
    fn test_cli_01() {

        let config = Cli::parse_from([APP_NAME,"--config=config", "ls", "pwd"]);
        println!("{config:?}");

        let config = Cli::parse_from([APP_NAME, "-c","config.yaml", "ls", "pwd"]);
        println!("{config:?}");

        let config = Cli::parse_from([APP_NAME, "-c","config.yaml"]);
        println!("{config:?}");

    }
}