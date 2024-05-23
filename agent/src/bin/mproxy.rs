use std::io::IsTerminal;
use anyhow::Context;
use clap::{Parser, ArgGroup};
use std::path::PathBuf;
use tokio::{signal, sync::broadcast};
use tracing_subscriber::EnvFilter;

#[derive(Parser, Debug)]
#[clap(name = mproxy::config::APP_NAME, version = env!("CARGO_PKG_VERSION"))]
#[clap(group(ArgGroup::new("cmds").args(&["CONFIG"]),))]
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

    let is_terminal = std::io::stdout().is_terminal();

    tracing_subscriber::fmt().with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::from("info")),)
        .with_ansi(is_terminal).init();

    let config = mproxy::config::Config::new(ops.config_path).with_context(|| "Config can not load")?;

    mproxy::run(shutdown_rx, config).await?;
    Ok(())
}


#[cfg(test)]
mod test {
    use clap::Parser;
    use crate::Cli;
    use mproxy::config::APP_NAME;

    #[test]
    fn parse_cli() {
        let result = Cli::parse_from([APP_NAME, "config.yaml"]);
        println!("{:?}", result);
        //let result = Cli::parse_from([APP_NAME, "--version"]);
        //println!("{:?}", result);
        //let result = Cli::parse_from([APP_NAME, "--help"]);
        //println!("{:?}", result);

        let result = Cli::parse_from([APP_NAME, "--", "config.yaml"]);
        println!("{:?}", result);

        let result = Cli::parse_from([APP_NAME, "--config=config.yaml"]);
        println!("{:?}", result);

    }
}