use reqwest::blocking::Client;
use serde::Deserialize;
use serde_json::json;
use std::collections::HashMap;
use std::error::Error;
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

#[derive(Deserialize)]
struct SchemasResponse {
    items: Vec<SchemaItem>,
}

#[derive(Deserialize)]
struct SchemaItem {
    schema_hex: String,
    schema_hash_hex: String,
}

pub fn get_schemas(
    package_address: &str,
) -> Result<Vec<Schema>, Box<dyn Error>> {
    let payload = json!({ "address": package_address });
    let response: SchemasResponse = Client::new()
        .post("https://mainnet.radixdlt.com/state/entity/page/schemas")
        .header("user-agent", "reqwest")
        .json(&payload)
        .send()?
        .json()?;

    let schemas = response
        .items
        .into_iter()
        .map(|item| Schema {
            schema: hex::decode(item.schema_hex).unwrap(),
            schema_hash: item.schema_hash_hex,
        })
        .collect();
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

#[derive(Deserialize)]
struct BlueprintsResponse {
    items: Vec<BlueprintItem>,
}

#[derive(Deserialize)]
struct BlueprintItem {
    name: String,
    definition: BlueprintDefinitionInner,
}

#[derive(Deserialize)]
struct BlueprintDefinitionInner {
    interface: BlueprintInterface,
}

#[derive(Deserialize)]
struct BlueprintInterface {
    events: Option<HashMap<String, EventValue>>,
    state: Option<StateValue>,
}

#[derive(Deserialize)]
struct EventValue {
    type_id: TypeIdValue,
}

#[derive(Deserialize)]
struct TypeIdValue {
    schema_hash: String,
    local_type_id: LocalTypeId,
}

#[derive(Deserialize)]
struct LocalTypeId {
    id: u32,
}

#[derive(Deserialize)]
struct StateValue {
    fields: FieldsContainer,
}

#[derive(Deserialize)]
struct FieldsContainer {
    fields: Vec<Field>,
}

#[derive(Deserialize)]
struct Field {
    field_type_ref: FieldTypeRef,
}

#[derive(Deserialize)]
struct FieldTypeRef {
    type_id: TypeIdValue,
}

pub fn get_blueprint_definitions(
    package_address: &str,
) -> Result<Vec<BlueprintDefinition>, Box<dyn Error>> {
    let url = "https://mainnet.radixdlt.com/state/package/page/blueprints";
    let payload = json!({ "package_address": package_address });
    let client = Client::new();
    let response: BlueprintsResponse = client
        .post(url)
        .header("user-agent", "reqwest")
        .json(&payload)
        .send()?
        .error_for_status()?
        .json()?;

    let mut blueprints = Vec::new();
    for item in response.items {
        let blueprint_name = item.name;
        let interface = item.definition.interface;
        let events = if let Some(events_map) = interface.events {
            events_map
                .into_iter()
                .map(|(event_name, event_value)| Type {
                    name: event_name,
                    type_id: event_value.type_id.local_type_id.id,
                    schema_hash: event_value.type_id.schema_hash,
                })
                .collect()
        } else {
            Vec::new()
        };

        let state_type = if let Some(state) = interface.state {
            let fields = state.fields.fields;
            if let Some(field) = fields.first() {
                let type_id_val = &field.field_type_ref.type_id;
                Type {
                    name: blueprint_name.clone(),
                    type_id: type_id_val.local_type_id.id,
                    schema_hash: type_id_val.schema_hash.clone(),
                }
            } else {
                return Err("No fields found in state".into());
            }
        } else {
            return Err("State not found in blueprint interface".into());
        };

        blueprints.push(BlueprintDefinition {
            state: state_type.clone(),
            events,
            schema_hash: state_type.schema_hash,
        });
    }
    Ok(blueprints)
}

#[derive(Debug, Clone)]
pub struct BlueprintWithSchema {
    pub blueprint: BlueprintDefinition,
    pub schema: Schema,
}

pub fn get_blueprints_and_corresponding_schemas(
    package_address: &str,
) -> Result<Vec<BlueprintWithSchema>, Box<dyn Error>> {
    let blueprints = get_blueprint_definitions(package_address)?;
    let schemas = get_schemas(package_address)?;

    let result = blueprints
        .into_iter()
        .map(|blueprint| {
            let schema = schemas
                .iter()
                .find(|s| blueprint.schema_hash == s.schema_hash)
                .cloned()
                .expect("Schema not found for blueprint");
            BlueprintWithSchema { blueprint, schema }
        })
        .collect();
    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_schema() {
        let package_address = "package_rdx1pkl8tdw43xqx64etxwdf8rjtvptqurq4c3fky0kaj6vwa0zrkfmcmc";
        let schemas =
            get_schemas(package_address).expect("Failed to get schemas");
        println!("Schemas: {:#?}", schemas);
    }

    #[test]
    fn test_get_blueprint_definitions() {
        let package_address = "package_rdx1ph3l366k7kq8mg8pzs5d0c855whtqtxkxnlxf2yzxvlelphztlqn05";
        let blueprints = get_blueprint_definitions(package_address)
            .expect("Failed to get blueprint definitions");
        println!("Blueprints: {:#?}", blueprints);
    }

    #[test]
    fn test_get_blueprints_and_schemas() {
        let package_address = "package_rdx1ph3l366k7kq8mg8pzs5d0c855whtqtxkxnlxf2yzxvlelphztlqn05";
        let blueprints_and_schemas =
            get_blueprints_and_corresponding_schemas(package_address)
                .expect("Failed to get blueprints and schemas");
        println!("Blueprints with Schemas: {:#?}", blueprints_and_schemas);
    }
}
