use anyhow::bail;
use etcetera::BaseStrategy;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tracing::info;

pub const APP_NAME: &str = "mproxy";

#[derive(Serialize, Deserialize, Debug)]
pub struct Config {
    command_topic: Option<String>,
    response_command_topic: Option<String>,
    pub server: String,
    pub client_id: String,
    pub username: Option<String>,
    pub password: Option<String>,
}

impl Config {
    pub fn new(config_path: Option<PathBuf>) -> anyhow::Result<Self> {
        let config_path = config_path.unwrap_or_else(|| Self::get_default_config_path());
        if !config_path.is_file() {
            bail!("config file not found: {:?}", config_path);
        }
        info!("load config from {:?}", config_path);
        let config = std::fs::read_to_string(config_path)?;
        let config: Config = serde_yml::from_str(&config)?;
        Ok(config)
    }

    fn get_default_config_path() -> PathBuf {
        let path = etcetera::choose_base_strategy()
            .unwrap()
            .config_dir()
            .join(APP_NAME);
        if !path.exists() {
            std::fs::create_dir_all(&path).unwrap();
        }
        path
    }

    pub fn get_command_topic(&self) -> String {
        self.command_topic.clone().unwrap_or_else(||format!("{}/cmd", self.client_id))

    }
    pub fn get_response_command_topic(&self) ->  String {
        self.command_topic.clone().unwrap_or_else(||format!("{}/cmd/resp",  self.client_id))
    }
}

#[cfg(test)]
mod test {
    use crate::config::Config;

    #[test]
    pub fn get_default_config_path_test() {
        println!("{:?}", Config::get_default_config_path());
    }

    #[test]
    pub fn test_config_serial() {
        let config = Config::new(Some("./config.yml".parse().unwrap())).unwrap();
        println!("{:?}", config)
    }
}
