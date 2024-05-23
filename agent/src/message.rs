use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "t", rename_all_fields="camelCase")]
pub enum RequestMessage {
    Cmd {
        command: String,
        req_id: String,
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "t", rename_all_fields="camelCase")]
pub enum ResponseMessage {
    D { req_id:String, seq:u32, data:String, pid:u32},
    Err { req_id:String, message:String },
    Ok { req_id: String, pid: u32},
}

#[cfg(test)]
mod test {
    use crate::message::ResponseMessage;

    #[test]
    fn test_one() {
        let r = ResponseMessage::Ok {req_id: "1".to_string(), pid:1};
        let parse_result = serde_json::to_string(&r);
        assert_eq!(parse_result.unwrap(),  r#"{"t":"Ok","reqId":"1","pid":1}"#.to_string());
    }
}
