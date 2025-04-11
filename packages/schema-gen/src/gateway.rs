// post request to mainnet.radixdlt.com/state/entity/page/schemas

use std::error::Error;

use reqwest::blocking::Client;
use serde_json::{json, Value};
use std::fmt::Debug;

#[derive(Clone)]
pub struct Schema {
    pub schema: Vec<u8>,
    pub schema_hash: String,
}

impl Debug for Schema {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Schema")
            .field("schema", &hex::encode(&self.schema))
            .field("schema_hash", &self.schema_hash)
            .finish()
    }
}

pub fn get_schemas(
    package_address: &str,
) -> Result<Vec<Schema>, reqwest::Error> {
    let req = json!({
        "address": package_address,
    });
    let response = reqwest::blocking::Client::new()
        .post("https://mainnet.radixdlt.com/state/entity/page/schemas")
        .json(&req)
        .header("user-agent", "reqwest")
        .send()?
        .json::<serde_json::Value>()?;
    let schemas = response["items"]
        .as_array()
        .unwrap()
        .iter()
        .map(|item| {
            let schema_hex = item["schema_hex"].as_str().unwrap();
            let schema_hash = item["schema_hash_hex"].as_str().unwrap();
            let schema_bytes = hex::decode(schema_hex).unwrap();
            Schema {
                schema: schema_bytes,
                schema_hash: schema_hash.to_string(),
            }
        })
        .collect::<Vec<_>>();

    Ok(schemas)
}

#[derive(Debug, Clone)]
pub struct Type {
    pub name: String,
    pub type_id: u32,
    pub schema_hash: String,
}

#[derive(Debug, Clone)]
pub struct BlueprintDefinition {
    pub state: Type,
    pub events: Vec<Type>,
    pub schema_hash: String,
}

pub fn get_blueprint_definitions(
    package_address: &str,
) -> Result<Vec<BlueprintDefinition>, Box<dyn Error>> {
    // Replace with the actual endpoint URL.
    let url = "https://mainnet.radixdlt.com/state/package/page/blueprints";

    // Create a blocking reqwest client.
    let client = Client::new();

    // Build the JSON payload.
    let payload = serde_json::json!({
        "package_address": package_address
    });

    // Send the POST request with the JSON payload.
    let response = client
        .post(url)
        .json(&payload)
        .header("user-agent", "reqwest")
        .send()?
        .error_for_status()?;

    // Parse the response body as JSON.
    let json: Value = response.json()?;

    // Create a vector to hold the blueprint structs.
    let mut blueprints = Vec::new();

    // Process the JSON to extract the blueprint names and event names.
    if let Some(items) = json.get("items").and_then(|v| v.as_array()) {
        for item in items {
            // Extract the blueprint name.
            let blueprint_name = item
                .get("name")
                .and_then(|v| v.as_str())
                .unwrap_or_default()
                .to_string();

            // Initialize an empty vector for events.
            let mut events = Vec::new();

            let mut schema_info: Option<(String, u32)> = None;

            // Navigate into the definition -> interface -> events section.
            if let Some(definition) = item.get("definition") {
                if let Some(interface) = definition.get("interface") {
                    if let Some(events_json) = interface.get("events") {
                        if let Some(event_obj) = events_json.as_object() {
                            for event in event_obj {
                                if let Some(type_id) = event.1.get("type_id") {
                                    let schema_hash = type_id
                                        .get("schema_hash")
                                        .and_then(|v| v.as_str())
                                        .unwrap_or_default()
                                        .to_string();
                                    if let Some(local_type_id) =
                                        type_id.get("local_type_id")
                                    {
                                        let id = local_type_id
                                            .get("id")
                                            .and_then(|v| v.as_u64())
                                            .unwrap_or_default()
                                            as u32;
                                        events.push(Type {
                                            name: event.0.clone(),
                                            type_id: id,
                                            schema_hash: schema_hash.clone(),
                                        });
                                    }
                                }
                            }
                        }
                    }
                    if let Some(state) = interface.get("state") {
                        if let Some(fields) = state
                            .get("fields")
                            .unwrap()
                            .as_object()
                            .unwrap()
                            .get("fields")
                        {
                            if let Some(fields) = fields.as_array() {
                                if let Some(field_type_ref) =
                                    fields[0].get("field_type_ref")
                                {
                                    if let Some(type_id) =
                                        field_type_ref.get("type_id")
                                    {
                                        let schema_hash = type_id
                                            .get("schema_hash")
                                            .and_then(|v| v.as_str())
                                            .unwrap_or_default()
                                            .to_string();
                                        if let Some(local_type_id) =
                                            type_id.get("local_type_id")
                                        {
                                            let id = local_type_id
                                                .get("id")
                                                .and_then(|v| v.as_u64())
                                                .unwrap_or_default()
                                                as u32;
                                            schema_info =
                                                Some((schema_hash, id));
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if schema_info.is_none() {
                return Err("Schema info not found".into());
            }
            // Add the blueprint to the vector.
            blueprints.push(BlueprintDefinition {
                state: Type {
                    name: blueprint_name.clone(),
                    type_id: schema_info.as_ref().unwrap().1,
                    schema_hash: schema_info.as_ref().unwrap().0.clone(),
                },
                events,
                schema_hash: schema_info.unwrap().0.clone(),
            });
        }
    }
    Ok(blueprints)
}

#[derive(Debug, Clone)]
pub struct BlueprintWithSchema {
    pub blueprint: BlueprintDefinition,
    pub schema: Schema,
}

// gets the blueprint definitions of a package and attaches the corresponding
// schemas by comparing the schema hashes
pub fn get_blueprints_and_corresponding_schemas(
    package_address: &str,
) -> Result<Vec<BlueprintWithSchema>, Box<dyn Error>> {
    let blueprints = get_blueprint_definitions(package_address)?;
    let schemas = get_schemas(package_address)?;

    let result = blueprints
        .iter()
        .map(|blueprint| {
            let schema = schemas
                .iter()
                .find(|schema| blueprint.schema_hash == schema.schema_hash)
                .cloned()
                .expect("Schema not found");
            BlueprintWithSchema {
                blueprint: blueprint.clone(),
                schema,
            }
        })
        .collect::<Vec<_>>();

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_schema() {
        let package_address = "package_rdx1pkl8tdw43xqx64etxwdf8rjtvptqurq4c3fky0kaj6vwa0zrkfmcmc";
        let schema = get_schemas(package_address);
        println!("Schema: {:?}", schema);
        let _schema_bytes = schema.unwrap();
    }

    #[test]
    fn get_blueprint_names_and_events_test() {
        let package_address = "package_rdx1ph3l366k7kq8mg8pzs5d0c855whtqtxkxnlxf2yzxvlelphztlqn05";
        let result = get_blueprint_definitions(package_address);
        println!("Blueprints: {:#?}", result);
    }

    #[test]
    fn test_get_blueprints_and_schemas() {
        let package_address = "package_rdx1ph3l366k7kq8mg8pzs5d0c855whtqtxkxnlxf2yzxvlelphztlqn05";
        let result = get_blueprints_and_corresponding_schemas(package_address);
        println!("Blueprints and Schemas: {:#?}", result);
    }
}
