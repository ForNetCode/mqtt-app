use std::io::{BufRead, BufReader};
use tokio::sync::broadcast;
use tracing::{info};
use crate::connection::Connection;
use std::process::{Command, Stdio};
use std::sync::Arc;
use crate::message::{RequestMessage, ResponseMessage};


type Receiver = broadcast::Receiver<(String,RequestMessage)>;
pub struct Handler {
    cmd_rx: Receiver,
    connection: Arc<Connection>,
    publish_topic: Arc<String>,
}



impl Handler {
    pub fn new(cmd_rx: Receiver, connection: Connection, publish_topic: String) -> Self {
        Self { cmd_rx, connection: Arc::new(connection), publish_topic: Arc::new(publish_topic)}
    }

    async fn run_command(connection:Arc<Connection>, cmd:RequestMessage, publish_topic:Arc<String>) {
        match cmd {
            RequestMessage::Cmd { command,request_id } => {
                let command_parsed = shellish_parse::parse(&command,false);
                let command_parsed = match command_parsed {
                    Ok(result) => result,
                    Err(e) => {
                        let _ = connection.publish_response(&publish_topic,  ResponseMessage::Err {request_id: request_id.clone(), message:format!("{}", e)}).await;
                        return;
                    }
                };

                let mut seq:u32 = 1;
                let mut command = Command::new(&command_parsed[0]);
                command.args(&command_parsed[1..]);

                command.stdout(Stdio::piped()).stderr(Stdio::piped());
                match command.spawn() {
                    Ok(mut child) => {
                        let pid = child.id();
                        if let Some(stdout) = child.stdout.take() {
                            let reader = BufReader::new(stdout);
                            for line in reader.lines().filter_map(|line| line.ok()) {
                                //TODO: handle publish error
                                let _ = connection.publish_response(
                                    &publish_topic, ResponseMessage::Ok {request_id: request_id.clone(),data:line, seq: seq, pid: pid}).await;
                                seq +=1;
                            }
                        }
                    }
                    Err(e) => {
                        let _ = connection.publish_response(&publish_topic,  ResponseMessage::Err {request_id: request_id.clone(), message:format!("{}", e)}).await;
                    }
                }
            }
        }
    }
    pub async fn run(&mut self, _shutdown_rx:broadcast::Receiver<bool>) {
        while let Ok((_, cmd)) = self.cmd_rx.recv().await {
            info!("begin to handle cmd: {:?}",&cmd);
            let connection = self.connection.clone();
            let publish_topic = self.publish_topic.clone();
            tokio::spawn(async move {
                Self::run_command(connection, cmd, publish_topic).await;
            });
        }
    }
}

#[cfg(test)]
mod test {
    use std::io::{BufRead, BufReader};
    use std::process::{Command, Stdio};

    use super::RequestMessage;


    #[test]
    fn test_serde() {
        let message:RequestMessage = serde_json::from_str(r#"{"type":"Cmd", "command":"ls"}"#).unwrap();
        println!("{:?}", message);
    }


    #[test]
    fn parse() {
        let v = shellish_parse::parse("ls -ls #tes",false).unwrap();
        println!("{v:?}");
    }

    #[test]
    fn parse_pipe_command() {
        let v = shellish_parse::multiparse("cat /etc/hosts|grep 127.0.0.1 #tes", false, &["&&", "||", "&", "|", ";"]).unwrap();
        println!("{v:?}");
    }
    #[test]
    fn run_pipe_command() {
        
    }

    #[test]
    fn command_run() {
        let mut cmd = Command::new("ls");
        cmd.arg("-ls");
        cmd.stdout(Stdio::piped()).stderr(Stdio::piped());
        let mut child = cmd
            .spawn().unwrap();


        if let Some(stdout) = child.stdout.take() {
            let reader = BufReader::new(stdout);
            reader.lines().filter_map(|line| line.ok()).for_each(|line| println!("{}", line));
        }

        println!("pid:{}",child.id());
        //std::thread::sleep(Duration::from_secs(10));
        child.kill().unwrap()

    }

}
