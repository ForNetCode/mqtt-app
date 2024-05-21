use std::sync::Arc;
use std::time::Duration;
use anyhow::{bail, Context};
use rumqttc::v5::{MqttOptions, AsyncClient, EventLoop, Event, Incoming, ClientError};
use rumqttc::v5::mqttbytes::QoS;
use tokio::sync::broadcast;
use tracing::{debug, error, info, warn};

use crate::config::Config;
use crate::message::{RequestMessage, ResponseMessage};

#[derive(Clone, Debug)]
pub struct Connection {
  pub client: AsyncClient,
}


impl Connection {
    pub async fn connect(config:Arc<Config>) -> anyhow::Result<(Self, EventLoop)>{
      info!("begin to connect mqtt server: {}", &config.server);
      let mqtt_url = format!("{}?client_id={}", &config.server, &config.client_id);
      let mut options = MqttOptions::parse_url(&mqtt_url).with_context(|| format!("parser mqtt url fail: {:?}", &mqtt_url))?;

      match (&config.password, &config.username) {
          (Some(pass), Some(user)) => {
              options.set_credentials(user, pass);
          }
          (None,None) => (),
          _ => bail!("password and username must both have or both not have"),
      };

      let (client, eventloop) = AsyncClient::new(options, 20);
      let topic = config.get_command_topic();
      let _ = client.subscribe(topic, QoS::ExactlyOnce).await?;
      info!("connect mqtt server successful");
      Ok((Connection {
          client,
      }, eventloop))
    }
    pub async fn publish_response(&self, topic:&String, message:ResponseMessage) -> Result<(), ClientError> {
        self.client.publish(topic, QoS::ExactlyOnce, false, serde_json::to_vec(&message).unwrap()).await
    }

    pub async fn loop_event(mut event_loop: EventLoop, mut shutdown_rx:broadcast::Receiver<bool>, mqtt_tx: broadcast::Sender<(String, RequestMessage)>) {
        loop {
            tokio::select! {
                _ = shutdown_rx.recv() => {
                    break;
                }
                event = event_loop.poll() => {
                    match event {
                        Ok(event) => {
                            match event {
                                Event::Incoming(Incoming::Publish(publish)) => {
                                    let message:serde_json::Result<RequestMessage> = serde_json::from_slice(publish.payload.as_ref());
                                    match message {
                                        Ok(result) => {
                                            mqtt_tx.send((String::from_utf8_lossy(publish.topic.as_ref()).to_string(), result)).unwrap();
                                        }
                                        Err(error) => {
                                            error!("receive bad message {:?}, error: {:?}", publish.payload, error);
                                        }
                                    }
                                }
                                event => debug!("mqtt does not handle {:?}", event)
                            };
                        },

                        Err(err)=> {
                            warn!("mqtt error, {:?}", err);
                            tokio::time::sleep(Duration::from_secs(5)).await;
                        }
                    }
                }
            }
        }
    }
}
