use serde::{Deserialize, Serialize};

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