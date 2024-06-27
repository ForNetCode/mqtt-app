use salvo::http::Method;
use salvo::prelude::*;
use std::collections::HashMap;
use tracing::Level;
use tracing_subscriber::EnvFilter;

const PUBLISH: &str = "2";
const SUBSCRIBE: &str = "1";
#[handler]
async fn auth(req: &mut Request, res: &mut Response) {
    let params = match parse_params(req).await {
        Ok(params) => params,
        Err(e) => {
            res.status_code(StatusCode::BAD_REQUEST);
            res.render(e.to_string());
            return
        }
    };

    let clientid = params
        .get("clientid")
        .map(|v| v.as_str())
        .unwrap_or_default();
    // for log
    if clientid.starts_with("log_") && (clientid.ends_with("_mini") || clientid.ends_with("_web")) {
        res.render(Text::Plain("allow"));
        return
    }
    // for shell
    if clientid.starts_with("shell_") && (clientid.ends_with("_admin") || clientid.ends_with("_agent")) {
        res.render(Text::Plain("allow"));
        return
    }

    res.render(Text::Plain("deny"));
    return;
    }

#[handler]
async fn acl(req: &mut Request, res: &mut Response) {
    let params = match parse_params(req).await {
        Ok(params) => params,
        Err(e) => {
            res.status_code(StatusCode::BAD_REQUEST);
            res.render(e.to_string());
            return
        }
    };

    //access = "%A", username = "%u", clientid = "%c", ipaddr = "%a", topic = "%t"
    let access = params.get("access").map(|v| v.as_str()).unwrap_or_default();
    let clientid = params
        .get("clientid")
        .map(|v| v.as_str())
        .unwrap_or_default();
    let topic = params.get("topic").map(|v| v.as_str()).unwrap_or_default();

    //mqtt log
    if clientid.starts_with("log_") {
        if clientid.ends_with("_web") && (access == PUBLISH && topic.starts_with("conf/log/") || access == SUBSCRIBE && topic.starts_with("log/")) ||
            clientid.ends_with("_mini")&& (access == PUBLISH && topic.starts_with("log/")) || (access == SUBSCRIBE && topic.starts_with("conf/log/")){
            res.render(Text::Plain("allow"));
            return
        }
    }

    //mqtt shell
    if clientid.starts_with("shell_") {
        if clientid.ends_with("_admin") && (access == PUBLISH && topic.starts_with("cmd/") || access == SUBSCRIBE && topic.starts_with("cmd/") && topic.ends_with("/resp")) ||
            clientid.ends_with("_agent") && (access == SUBSCRIBE && topic.starts_with("cmd/") || access == PUBLISH && topic.starts_with("cmd/") && topic.ends_with("/resp")){
            res.render(Text::Plain("allow"));
            return
        }
    }
    res.render(Text::Plain("deny"));
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::builder()
                .with_default_directive(Level::INFO.into())
                .from_env_lossy(),
        )
        .init();
    let router = Router::new()
        .push(
            Router::with_path("/mqtt/auth")
                .get(auth)
                .post(auth)
                .put(auth),
        )
        .push(Router::with_path("/mqtt/acl").get(acl).post(acl).put(acl));



    let router =router;
    let acceptor = TcpListener::new("0.0.0.0:5800").bind().await;
    Server::new(acceptor).serve(router).await;
}

async fn parse_params(req: &mut Request) -> Result<HashMap<String, String>, anyhow::Error> {
    match req.method() {
        &Method::GET => Ok(req.parse_queries::<HashMap<String, String>>()?),
        &Method::POST | &Method::PUT => {
            if let Some(ctype) = req.content_type() {
                match ctype.essence_str() {
                    "application/x-www-form-urlencoded" => {
                        Ok(req.parse_form::<HashMap<String, String>>().await?)
                    }
                    "application/json" => Ok(req.parse_json::<HashMap<String, String>>().await?),
                    _ => Err(anyhow::Error::msg(format!(
                        "content type({:?}) not supported",
                        ctype
                    ))),
                }
            } else {
                Err(anyhow::Error::msg("content type is not exist"))
            }
        }
        _ => Err(anyhow::Error::msg(format!(
            "method({}) not supported",
            req.method()
        ))),
    }
}