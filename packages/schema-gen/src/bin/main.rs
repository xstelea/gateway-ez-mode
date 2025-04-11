use clap::{Parser, Subcommand};
use sbor::Schema;
use schema_gen::ez_mode_gen::generate_ir;

use scrypto::prelude::{scrypto_decode, ScryptoCustomSchema};

/// CLI arguments definition with subcommands.
#[derive(Parser)]
#[clap(author, version, about)]
struct Cli {
    #[clap(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// List all available type names in the schema.
    List { package_address: String },
    /// Generate TS schema from the package address.
    Gen {
        package_address: String,
        #[clap(
            long,
            short,
            help = "Render as a ready-to-use module with export and import syntax"
        )]
        module: bool,
    },
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
        Command::List { package_address } => {
            let schemas = schema_gen::gateway::get_schemas(&package_address);
            match schemas {
                Ok(schemas) => {
                    for schema in schemas {
                        let schema: Schema<ScryptoCustomSchema> =
                            scrypto_decode(&schema.schema)
                                .expect("Failed to decode schema");
                        println!(
                            "Schema for blueprint: {:?}",
                            schema.type_metadata[0].type_name
                        );
                        print_type_names(&schema);
                        println!();
                    }
                }
                Err(e) => {
                    eprintln!("Could not get package information: {}", e);
                }
            }
        }
        Command::Gen {
            package_address,
            module,
        } => {
            let schemas =
                schema_gen::gateway::get_blueprints_and_corresponding_schemas(
                    &package_address,
                );
            match schemas {
                Ok(schemas) => {
                    let registry = generate_ir(&schemas);
                    println!(
                        "{}\n\n",
                        registry.render(&package_address, module)
                    );
                }
                Err(e) => {
                    eprintln!("Could not get package information: {}", e);
                }
            }
        }
    }
}
