use std::io::{BufRead, BufReader};
use serde::{Deserialize, Serialize};
use tokio::sync::broadcast;
use tracing::{info};
use crate::connection::Connection;
use std::process::Command;


#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type")]
pub enum RequestMessage {
    Cmd {
        command: String,
        request_id: String,
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type")]
pub enum ResponseMessage {
    Ok{ request_id:String, seq:u32, data:String, pid:u32},
    Err{ request_id:String, message:String}
}


type Receiver = broadcast::Receiver<(String,RequestMessage)>;
pub struct Handler {
    cmd_rx: Receiver,
    connection: Connection,
    publish_topic: String,
}



impl Handler {
    pub fn new(cmd_rx: Receiver, connection: Connection, publish_topic: String) -> Self {
        Self { cmd_rx, connection, publish_topic}
    }

    pub async fn run(&mut self, _shutdown_rx:broadcast::Receiver<bool>) {

        while let Ok((_, cmd)) = self.cmd_rx.recv().await {
            info!("begin to handle cmd: {:?}",&cmd);
            match cmd {
                RequestMessage::Cmd { command,request_id } => {
                    let mut seq:u32 = 1;
                    match Command::new(&command).spawn() {
                        Ok(mut child) => {
                            let pid = child.id();
                            if let Some(stdout) = child.stdout.take() {
                                let reader = BufReader::new(stdout);
                                for line in reader.lines().filter_map(|line| line.ok()) {
                                    //TODO: handle publish error
                                    let _ = self.connection.publish_response(
                                        &self.publish_topic, ResponseMessage::Ok {request_id: request_id.clone(),data:line, seq: seq, pid: pid}).await;
                                    seq +=1;
                                }
                            }
                        }
                        Err(e) => {
                            let _ = self.connection.publish_response(&self.publish_topic,  ResponseMessage::Err {request_id: request_id.clone(), message:format!("{}", e)}).await;
                        }
                    }
                }
            }
        }
    }
}

#[cfg(test)]
mod test {
    use std::io::{BufRead, BufReader};
    use std::process::Command;
    use std::time::Duration;

    use super::RequestMessage;


    #[test]
    fn test_serde() {
        let message:RequestMessage = serde_json::from_str(r#"{"type":"Cmd", "command":"ls"}"#).unwrap();
        println!("{:?}", message);
    }


    #[test]
    pub fn parse() {
        let mut child = Command::new("top")
            .spawn().unwrap();
        if let Some(stdout) = child.stdout.take() {
            let reader = BufReader::new(stdout);
            reader.lines().filter_map(|line| line.ok()).for_each(|line| println!("{}", line));
        }

        println!("pid:{}",child.id());
        std::thread::sleep(Duration::from_secs(10));
        child.kill().unwrap()

    }

}
