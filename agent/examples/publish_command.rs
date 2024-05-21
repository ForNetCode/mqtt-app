use std::env;
use std::path::PathBuf;
use rumqttc::v5::{AsyncClient, MqttOptions, Incoming};
use rumqttc::v5::mqttbytes::QoS;
use tracing_subscriber::EnvFilter;
use mproxy::message::{RequestMessage, ResponseMessage};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let args:Vec<String> = env::args().collect();
    let command = if args.len() > 1 {
        args.iter().skip(1).map(|x|x.to_string()).collect::<Vec<_>>().join(" ")
    } else {
      "ls -ls".to_string()
    };

    let config_path:PathBuf = "./config.yml".parse().unwrap();

    let is_atty = atty::is(atty::Stream::Stdout);
    tracing_subscriber::fmt().with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::from("debug")),)
        .with_ansi(is_atty).init();

    let config = mproxy::config::Config::new(Some(config_path)).unwrap();

    let mqtt_url = format!("{}?client_id={}", &config.server, "test_web");
    let options = MqttOptions::parse_url(&mqtt_url).unwrap();
    let (client, mut eventloop) = AsyncClient::new(options,20);

    let topic = config.get_response_command_topic();
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
    client.publish(config.get_command_topic(), QoS::ExactlyOnce, false, command).await?;
    tokio::signal::ctrl_c().await?;

    Ok(())
}