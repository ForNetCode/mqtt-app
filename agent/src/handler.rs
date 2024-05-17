use serde::{Deserialize, Serialize};
use tokio::sync::broadcast;
use tracing::info;
use crate::connection::Connection;


#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type")]
pub enum RequestMessage {
    Cmd {
        command: String,
        request_id: String,
    }
}

//#[derive(Serialize, Deserialize, Debug, Clone)]
//#[serde(tag = "type")]
pub struct ResponseMessage {
    request_id: String,
//    response: T,
}


type Receiver = broadcast::Receiver<(String,RequestMessage)>;
pub struct Handler {
    cmd_rx: Receiver,
}



impl Handler {
    pub fn new(cmd_rx: Receiver) -> Self {
        Self { cmd_rx }
    }

    pub async fn run(&mut self, _connection: Connection, _shutdown_rx:broadcast::Receiver<bool>) {
        while let Ok(cmd) = self.cmd_rx.recv().await {
            info!("begin to handle cmd: {:?}",cmd);
        }
    }
}

#[cfg(test)]
mod test {
    use std::io::{BufRead, BufReader};
    use std::process::{Command, Stdio};

    use cmd_lib::{run_cmd, spawn, spawn_with_output};
    use super::RequestMessage;

    #[test]
    fn test_serde() {
        let message:RequestMessage = serde_json::from_str(r#"{"type":"Cmd", "command":"ls"}"#).unwrap();
        println!("{:?}", message);
    }
    #[test]
    pub fn run_basic_shell() {
        let command = vec!["ls", "-ls"];
        let mut z = spawn_with_output!($[command]).unwrap();
        println!("{:?}", z.wait_with_output());
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

    }
    #[test]
    pub fn parse2() {

        let mut v = spawn!(top).unwrap();

        v.kill().unwrap();


    }
    #[test]
    pub fn run_stream_shell() {

        let mut z = spawn_with_output!(top).unwrap();


        println!("pids:{:?}",z.pids());

         z.wait_with_pipe(&mut|pipe| {
            BufReader::new(pipe)
                .lines()
                .take(5)
                .filter_map(|line| line.ok())
                .for_each(|line| println!("{}", line));
        }).unwrap();
        println!("over");
    }
}
