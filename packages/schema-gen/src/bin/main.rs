use clap::{Args, Parser, Subcommand};
use hex;
use sbor::{LocalTypeId, Schema};
use schema_gen::schema::generate_ir;
use std::{fs, path::PathBuf};

use scrypto::prelude::{scrypto_decode, ScryptoCustomSchema};

/// CLI arguments definition with subcommands.
#[derive(Parser)]
#[clap(author, version, about)]
struct Cli {
    #[clap(subcommand)]
    command: Command,
}

/// Common schema input arguments.
#[derive(Args)]
struct SchemaInput {
    /// Hex string representing the schema (if not reading from file)
    #[clap(long, conflicts_with = "hex_file")]
    hex: Option<String>,

    /// Path to file containing the hex schema
    #[clap(long, conflicts_with = "hex")]
    hex_file: Option<PathBuf>,
}

#[derive(Subcommand)]
enum Command {
    /// Generate the TypeScript schema for a specific type.
    Gen {
        #[clap(flatten)]
        schema_input: SchemaInput,
        /// The type name to generate the TypeScript schema for.
        #[clap(long)]
        type_name: String,
    },
    /// List all available type names in the schema.
    List { package_address: String },
    /// Easy command that takes a package address.
    Ez {
        /// The package address.
        package_address: String,
    },
}

/// Helper function to obtain the hex schema string from the provided SchemaInput.
fn get_hex_schema(input: &SchemaInput) -> String {
    if let Some(path) = &input.hex_file {
        fs::read_to_string(path).expect("Failed to read hex file")
    } else if let Some(hex) = &input.hex {
        hex.clone()
    } else {
        panic!("Either --hex or --hex-file must be provided");
    }
}

/// Print all available type names from the schema.
fn print_type_names(schema: &Schema<ScryptoCustomSchema>) {
    for (i, metadata) in schema.type_metadata.iter().enumerate() {
        if let Some(name) = &metadata.type_name {
            println!("{}: {}", i, name);
        }
    }
}
fn main() {
    let cli = Cli::parse();

    match cli.command {
        Command::Gen {
            schema_input,
            type_name,
        } => {
            // let hex_string = get_hex_schema(&schema_input);
            // let bytes =
            //     hex::decode(hex_string.trim()).expect("Invalid hex string");
            // let schema: Schema<ScryptoCustomSchema> =
            //     scrypto_decode(&bytes).expect("Failed to decode schema");

            // let maybe_type = get_type_by_name(&schema, &type_name);

            // let (i, (metadata, kind)) = match maybe_type {
            //     Some((i, (metadata, kind))) => (i, (metadata, kind)),
            //     None => {
            //         eprintln!("Type '{}' not found in the schema", type_name);
            //         std::process::exit(1);
            //     }
            // };

            // // Generate and print the TypeScript schema.
            // let ts_schema = generate_ts_schema_with_registry(
            //     &schema,
            //     &metadata,
            //     &kind,
            //     LocalTypeId::SchemaLocalIndex(i),
            // );
            // println!("const {}Schema = {:#?};", type_name, ts_schema);
        }
        Command::List { package_address } => {
            let schemas = schema_gen::gateway::get_schemas(&package_address)
                .expect("Failed to get schema");
            for schema in schemas {
                let schema: Schema<ScryptoCustomSchema> =
                    scrypto_decode(&schema.schema)
                        .expect("Failed to decode schema");
                print_type_names(&schema);
            }
        }
        Command::Ez { package_address } => {
            let schemas =
                schema_gen::gateway::get_blueprints_and_corresponding_schemas(
                    &package_address,
                )
                .expect("Failed to get schema");
            let blueprints =
                schema_gen::gateway::get_blueprints_and_corresponding_schemas(
                    &package_address,
                )
                .expect("Failed to get blueprints");
            // let blueprint_event_names = blueprints
            //     .iter()
            //     .flat_map(|blueprint| {
            //         let mut names = vec![blueprint.name.clone()];
            //         names.extend(blueprint.events.clone());
            //         names
            //     })
            //     .collect::<Vec<_>>();

            // for schema in schemas.iter() {
            //     let schema: Schema<ScryptoCustomSchema> =
            //         scrypto_decode(&schema).expect("Failed to decode schema");
            //     let blueprint_name = get_blueprint_name_from_schema(&schema)
            //         .expect("Failed to get blueprint name");
            //     println!("/*");
            //     let middle_line =
            //         format!("## Blueprint: {} ##", blueprint_name);
            //     let middle_line_len = middle_line.len();
            //     println!("{:#^width$}", "", width = middle_line_len);
            //     println!("{}", middle_line);
            //     println!("{:#^width$}", "", width = middle_line_len);
            //     println!("*/\n");
            //     let blueprint = blueprints
            //         .iter()
            //         .find(|b| b.name == blueprint_name)
            //         .expect("Failed to find blueprint");

            //     let mut blueprint_types = vec![blueprint_name];
            //     blueprint_types.extend(blueprint.events.clone());

            //     let schema = generate_ts_schemas_for_all_types(
            //         &schema,
            //         // &blueprint_types
            //         //     .iter()
            //         //     .map(|name| name.as_str())
            //         //     .collect::<Vec<_>>(),
            //         // &blueprint_type_names,
            //     );
            //     println!("{}\n\n", schema.to_typescript());
            // }
            // let schemas = schemas
            //     .iter()
            //     .map(|schema| {
            //         let schema: Schema<ScryptoCustomSchema> =
            //             scrypto_decode(&schema)
            //                 .expect("Failed to decode schema");
            //         schema
            //     })
            //     .collect::<Vec<_>>();
            let ding = generate_ir(&schemas);
            println!("{}\n\n", ding.render());
        }
    }
}
