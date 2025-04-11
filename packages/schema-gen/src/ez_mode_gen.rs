use crate::gateway::BlueprintWithSchema;
use radix_common::data::scrypto::well_known_scrypto_custom_types;
use sbor::prelude::indexmap::IndexMap;
use sbor::{LocalTypeId, LocalTypeKind, Schema, TypeKind, TypeMetadata};
use scrypto::prelude::{
    scrypto_decode, ScryptoCustomSchema, ScryptoCustomTypeKind,
};
use std::borrow::Cow;
use std::collections::HashSet;

//
// Helper: whether a RegistryEntry can be rendered inline
//
fn is_inline(entry: &RegistryEntry) -> bool {
    match entry.schema_kind {
        TypeScriptSchemaKind::Address
        | TypeScriptSchemaKind::InternalAddress
        | TypeScriptSchemaKind::Number
        | TypeScriptSchemaKind::String
        | TypeScriptSchemaKind::Bool
        | TypeScriptSchemaKind::Decimal
        | TypeScriptSchemaKind::NonFungibleLocalId
        | TypeScriptSchemaKind::Array { .. }
        | TypeScriptSchemaKind::Option { .. }
        | TypeScriptSchemaKind::Value
        | TypeScriptSchemaKind::Instant
        | TypeScriptSchemaKind::Map { .. } => true,
        // Anonymous tuples should be rendered inline, while named tuples should be rendered separately.
        TypeScriptSchemaKind::Tuple { .. } => entry.type_name.is_none(),
        _ => false,
    }
}

/// A registry entry holds a type’s metadata and its computed TypeScript schema expression.
#[derive(Clone, Debug)]
pub struct RegistryEntry {
    pub type_hash: TypeHash,
    /// The variable name used in the TypeScript output.
    pub type_name: Option<String>,
    /// The computed TypeScript schema (s.* expression).
    pub schema_kind: TypeScriptSchemaKind,
    /// A set of dependency indices.
    pub dependencies: HashSet<u32>,
}

impl RegistryEntry {
    /// Returns a unique variable name based on the type and its index in the registry.
    pub fn unique_var_name(&self, registry: &SchemaRegistry) -> String {
        let position =
            registry.entries.iter().position(|e| e == self).unwrap_or(0);
        match &self.type_name {
            Some(name) => {
                if registry.is_type_name_unique(name) {
                    name.to_string()
                } else {
                    format!("{}_{}", name, position)
                }
            }
            None => {
                format!("Type{}", position)
            }
        }
    }

    /// Render the entry into a TypeScript expression.
    pub fn render(&self, registry: &SchemaRegistry) -> String {
        match &self.schema_kind {
            TypeScriptSchemaKind::Address => "s.address()".to_string(),
            TypeScriptSchemaKind::Map {
                key_type,
                value_type,
            } => {
                let key_entry = &registry.entries[*key_type as usize];
                let value_entry = &registry.entries[*value_type as usize];
                format!(
                    "s.map({{ key: {}, value: {} }})",
                    if is_inline(key_entry) {
                        key_entry.render(registry)
                    } else {
                        key_entry.unique_var_name(registry)
                    },
                    if is_inline(value_entry) {
                        value_entry.render(registry)
                    } else {
                        value_entry.unique_var_name(registry)
                    }
                )
            }
            TypeScriptSchemaKind::String => "s.string()".to_string(),
            TypeScriptSchemaKind::Decimal => "s.decimal()".to_string(),
            TypeScriptSchemaKind::InternalAddress => {
                "s.internalAddress()".to_string()
            }
            TypeScriptSchemaKind::Number => "s.number()".to_string(),
            TypeScriptSchemaKind::Bool => "s.bool()".to_string(),
            TypeScriptSchemaKind::Instant => "s.instant()".to_string(),
            TypeScriptSchemaKind::NonFungibleLocalId => {
                "s.nonFungibleLocalId()".to_string()
            }
            TypeScriptSchemaKind::Value => "s.value()".to_string(),
            TypeScriptSchemaKind::Array { element_type } => {
                let entry = &registry.entries[*element_type as usize];
                format!(
                    "s.array({})",
                    if is_inline(entry) {
                        entry.render(registry)
                    } else {
                        entry.unique_var_name(registry)
                    }
                )
            }
            TypeScriptSchemaKind::Tuple { fields } => {
                let field_entries: Vec<String> = fields
                    .iter()
                    .map(|&field_type| {
                        let entry = &registry.entries[field_type as usize];
                        if is_inline(entry) {
                            entry.render(registry)
                        } else {
                            entry.unique_var_name(registry)
                        }
                    })
                    .collect();
                format!("s.tuple([{}])", field_entries.join(", "))
            }
            TypeScriptSchemaKind::Struct { fields } => {
                let field_entries: Vec<String> = fields
                    .iter()
                    .map(|(name, field_type)| {
                        let entry = &registry.entries[*field_type as usize];
                        if is_inline(entry) {
                            format!("{}: {}", name, entry.render(registry))
                        } else {
                            format!(
                                "{}: {}",
                                name,
                                entry.unique_var_name(registry)
                            )
                        }
                    })
                    .collect();
                format!("s.struct({{\n  {}\n}})", field_entries.join(",\n  "))
            }
            TypeScriptSchemaKind::Enum { variants } => {
                let variant_entries: Vec<String> = variants
                    .iter()
                    .map(|(name, variant_type)| {
                        let entry = &registry.entries[*variant_type as usize];
                        format!(
                            "  {{ variant: \"{}\", schema: {} }}",
                            name,
                            if is_inline(entry) {
                                entry.render(registry)
                            } else {
                                entry.unique_var_name(registry)
                            }
                        )
                    })
                    .collect();
                format!("s.enum([\n{}\n])", variant_entries.join(",\n"))
            }
            TypeScriptSchemaKind::Option { inner_types } => {
                let inner_entries: Vec<String> = inner_types
                    .iter()
                    .map(|&inner_type| {
                        let entry = &registry.entries[inner_type as usize];
                        if is_inline(entry) {
                            entry.render(registry)
                        } else {
                            entry.unique_var_name(registry)
                        }
                    })
                    .collect();
                if inner_entries.len() == 1 {
                    format!("s.option({})", inner_entries[0])
                } else {
                    format!("s.option(s.tuple([{}]))", inner_entries.join(", "))
                }
            }
        }
    }
}

impl PartialEq for RegistryEntry {
    fn eq(&self, other: &Self) -> bool {
        self.type_hash == other.type_hash
    }
}

impl Eq for RegistryEntry {}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct TypeHash(pub String);

impl TypeHash {
    pub fn create(
        metadata: &TypeMetadata,
        kind: &TypeKind<ScryptoCustomTypeKind, LocalTypeId>,
    ) -> Self {
        let string = format!("{:?}-{:?}", metadata, kind);
        Self(string)
    }
}

/// Represents the kinds of TypeScript schemas to generate.
#[derive(Clone, Debug)]
pub enum TypeScriptSchemaKind {
    Struct { fields: Vec<(String, u32)> },
    Tuple { fields: Vec<u32> },
    Array { element_type: u32 },
    Map { key_type: u32, value_type: u32 },
    Enum { variants: Vec<(String, u32)> },
    Option { inner_types: Vec<u32> },
    Decimal,
    Address,
    InternalAddress,
    Number,
    String,
    Bool,
    Instant,
    NonFungibleLocalId,
    Value,
}

/// The registry collects generated types. It also lets us deduplicate types
/// by comparing their computed TypeScript expressions.
#[derive(Default, Debug)]
pub struct SchemaRegistry {
    /// Entries are stored in the order they were registered.
    pub entries: Vec<RegistryEntry>,
    /// Track currently processing types.
    pub processing: HashSet<LocalTypeId>,
}

impl SchemaRegistry {
    pub fn new() -> Self {
        Self {
            entries: Vec::new(),
            processing: HashSet::new(),
        }
    }

    pub fn has_type(
        &self,
        kind: &TypeKind<ScryptoCustomTypeKind, LocalTypeId>,
        metadata: &TypeMetadata,
    ) -> bool {
        self.entries
            .iter()
            .any(|entry| entry.type_hash == TypeHash::create(metadata, kind))
    }

    pub fn is_type_name_unique(&self, type_name: &str) -> bool {
        let occurrences = self
            .entries
            .iter()
            .filter(|entry| entry.type_name == Some(type_name.to_string()))
            .count();
        occurrences <= 1
    }

    pub fn register(&mut self, entry: &RegistryEntry) -> u32 {
        if let Some((i, _)) = self
            .entries
            .iter()
            .enumerate()
            .find(|(_, e)| e.type_hash == entry.type_hash)
        {
            return i as u32;
        }
        self.entries.push(entry.clone());
        (self.entries.len() - 1) as u32
    }

    /// Registers a type and returns the entry plus its index.
    pub fn get_or_register(
        &mut self,
        schema: &Schema<ScryptoCustomSchema>,
        metadata: &TypeMetadata,
        kind: &TypeKind<ScryptoCustomTypeKind, LocalTypeId>,
        type_id: LocalTypeId,
    ) -> (&RegistryEntry, u32) {
        if self.has_type(kind, metadata) {
            let entry = self
                .entries
                .iter()
                .find(|e| e.type_hash == TypeHash::create(metadata, kind))
                .unwrap();
            let pos = self
                .entries
                .iter()
                .position(|e| e.type_hash == TypeHash::create(metadata, kind))
                .unwrap() as u32;
            (entry, pos)
        } else {
            let entry = create_entry(self, schema, metadata, kind, type_id);
            self.entries.push(entry);
            let pos = self.entries.len() as u32 - 1;
            (self.entries.last().unwrap(), pos)
        }
    }

    /// Returns a topologically sorted ordering of the registry indices.
    pub fn topologically_sorted_indices(&self) -> Result<Vec<u32>, String> {
        let n = self.entries.len();
        let mut in_degree: Vec<usize> = vec![0; n];
        let mut dependents: Vec<Vec<u32>> = vec![Vec::new(); n];

        for (i, entry) in self.entries.iter().enumerate() {
            for &dep in &entry.dependencies {
                if (dep as usize) >= n {
                    return Err(format!(
                        "Invalid dependency index {} in entry {}",
                        dep, i
                    ));
                }
                in_degree[i] += 1;
                dependents[dep as usize].push(i as u32);
            }
        }

        let mut queue: Vec<u32> = (0..n)
            .filter(|&i| in_degree[i] == 0)
            .map(|i| i as u32)
            .collect();
        let mut sorted = Vec::with_capacity(n);

        while let Some(u) = queue.pop() {
            sorted.push(u);
            for &v in &dependents[u as usize] {
                in_degree[v as usize] -= 1;
                if in_degree[v as usize] == 0 {
                    queue.push(v);
                }
            }
        }

        if sorted.len() == n {
            Ok(sorted)
        } else {
            Err("Cycle detected in dependency graph".to_string())
        }
    }

    /// Render the registry entries in topologically sorted order.
    pub fn render(&self, package_address: &str, module: bool) -> String {
        let mut output = String::new();
        let sorted_indices =
            self.topologically_sorted_indices().unwrap_or_else(|err| {
                panic!("Error performing topological sort: {}", err);
            });
        for i in sorted_indices {
            let entry = &self.entries[i as usize];
            if entry.type_name == Some("AvlTree".to_string()) {
                println!("{:?}", entry);
                println!("Index: {}", i);
            }
            if entry.type_name == Some("Node".to_string()) {
                println!("{:?}", entry);
                println!("Index: {}", i);
            }
            if is_inline(entry) {
                continue;
            }
            output.push_str(&format!(
                "{}const {} = {};\n\n",
                if module { "export " } else { "" },
                entry.unique_var_name(self),
                entry.render(self)
            ));
        }

        let mut final_output = String::new();

        if module {
            final_output.push_str(&format!(
                "import s from '@calamari-radix/sbor-ez-mode';\n"
            ));
        }

        final_output.push_str(&format!(
            "// Generated TypeScript schema for Scrypto SBOR types of package address: {}\n//Generated by: https://www.8arms1goal.com/sbor-ez-mode-ez-mode\n\n",
            package_address
        ));
        final_output.push_str(&output);
        final_output
    }
}

///
/// Helper: Registers a type by resolving its kind and metadata.
/// This function encapsulates the pattern of resolving a type and calling get_or_register.
///
fn register_type(
    registry: &mut SchemaRegistry,
    schema: &Schema<ScryptoCustomSchema>,
    type_id: LocalTypeId,
) -> (RegistryEntry, u32) {
    let kind = schema.resolve_type_kind(type_id).unwrap();
    let metadata = schema.resolve_type_metadata(type_id).unwrap();
    let (entry, index) =
        registry.get_or_register(schema, metadata, kind, type_id);
    (entry.clone(), index)
}

///
/// Helper: Handle tuple types.
/// If field names exist, output as a struct; otherwise, as a tuple.
///
fn handle_tuple(
    field_types: &[LocalTypeId],
    registry: &mut SchemaRegistry,
    schema: &Schema<ScryptoCustomSchema>,
    metadata: &TypeMetadata,
    kind: &TypeKind<ScryptoCustomTypeKind, LocalTypeId>,
) -> RegistryEntry {
    if let Some(field_names) = metadata.get_field_names() {
        // Named fields: struct variant.
        let field_entries: Vec<(String, u32, RegistryEntry)> = field_types
            .iter()
            .enumerate()
            .map(|(i, &field_type)| {
                let (entry, index) =
                    register_type(registry, schema, field_type);
                (field_names[i].to_string(), index, entry)
            })
            .collect();
        let dependencies: HashSet<u32> = field_entries
            .iter()
            .flat_map(|(_, index, entry)| {
                let mut deps = entry.dependencies.clone();
                deps.insert(*index);
                deps.into_iter()
            })
            .collect();
        let fields = field_entries
            .into_iter()
            .map(|(name, index, _)| (name, index))
            .collect();
        RegistryEntry {
            type_hash: TypeHash::create(metadata, kind),
            type_name: metadata.get_name().map(|s| s.to_string()),
            schema_kind: TypeScriptSchemaKind::Struct { fields },
            dependencies,
        }
    } else {
        // Unnamed fields: simple tuple.
        let field_entries: Vec<(RegistryEntry, u32)> = field_types
            .iter()
            .map(|&field_type| register_type(registry, schema, field_type))
            .collect();
        let dependencies: HashSet<u32> = field_entries
            .iter()
            .flat_map(|(entry, index)| {
                let mut deps = entry.dependencies.clone();
                deps.insert(*index);
                deps.into_iter()
            })
            .collect();
        let indices =
            field_entries.into_iter().map(|(_, index)| index).collect();
        RegistryEntry {
            type_hash: TypeHash::create(metadata, kind),
            type_name: metadata.get_name().map(|s| s.to_string()),
            schema_kind: TypeScriptSchemaKind::Tuple { fields: indices },
            dependencies,
        }
    }
}

///
/// Helper: Handle array types.
///
fn handle_array(
    element_type: LocalTypeId,
    registry: &mut SchemaRegistry,
    schema: &Schema<ScryptoCustomSchema>,
    metadata: &TypeMetadata,
    kind: &TypeKind<ScryptoCustomTypeKind, LocalTypeId>,
) -> RegistryEntry {
    let (entry, index) = register_type(registry, schema, element_type);
    let mut dependencies = entry.dependencies.clone();
    dependencies.insert(index);
    RegistryEntry {
        type_hash: TypeHash::create(metadata, kind),
        type_name: metadata.get_name().map(|s| s.to_string()),
        schema_kind: TypeScriptSchemaKind::Array {
            element_type: index,
        },
        dependencies,
    }
}

///
/// Helper: Handle map types.
///
fn handle_map(
    key_type: LocalTypeId,
    value_type: LocalTypeId,
    registry: &mut SchemaRegistry,
    schema: &Schema<ScryptoCustomSchema>,
    metadata: &TypeMetadata,
    kind: &TypeKind<ScryptoCustomTypeKind, LocalTypeId>,
) -> RegistryEntry {
    let (key_entry, key_index) = register_type(registry, schema, key_type);
    let (value_entry, value_index) =
        register_type(registry, schema, value_type);
    let mut dependencies: HashSet<u32> = key_entry
        .dependencies
        .union(&value_entry.dependencies)
        .cloned()
        .collect();
    // Explicitly add direct dependency indices for key and value.
    dependencies.insert(key_index);
    dependencies.insert(value_index);
    RegistryEntry {
        type_hash: TypeHash::create(metadata, kind),
        type_name: metadata.get_name().map(|s| s.to_string()),
        schema_kind: TypeScriptSchemaKind::Map {
            key_type: key_index,
            value_type: value_index,
        },
        dependencies,
    }
}
///
/// Helper: Handle custom Scrypto types.
///
fn handle_custom(
    custom: &ScryptoCustomTypeKind,
    metadata: &TypeMetadata,
    kind: &TypeKind<ScryptoCustomTypeKind, LocalTypeId>,
) -> RegistryEntry {
    let schema_kind = match custom {
        ScryptoCustomTypeKind::Decimal
        | ScryptoCustomTypeKind::PreciseDecimal => {
            TypeScriptSchemaKind::Decimal
        }
        ScryptoCustomTypeKind::Reference => TypeScriptSchemaKind::Address,
        ScryptoCustomTypeKind::Own => TypeScriptSchemaKind::InternalAddress,
        ScryptoCustomTypeKind::NonFungibleLocalId => {
            TypeScriptSchemaKind::NonFungibleLocalId
        }
    };
    RegistryEntry {
        type_hash: TypeHash::create(metadata, kind),
        type_name: metadata.get_name().map(|s| s.to_string()),
        schema_kind,
        dependencies: HashSet::new(),
    }
}

///
/// Helper: Handle enum types (Which can eiher be parsed to an Option or not).
///
fn handle_enum(
    variants: &IndexMap<u8, Vec<LocalTypeId>>,
    registry: &mut SchemaRegistry,
    schema: &Schema<ScryptoCustomSchema>,
    metadata: &TypeMetadata,
    kind: &TypeKind<ScryptoCustomTypeKind, LocalTypeId>,
) -> RegistryEntry {
    // Check for Option enum.
    if metadata.type_name.as_ref() == Some(&Cow::Owned("Option".to_string())) {
        if let Some((_, type_ids)) =
            variants.into_iter().find(|(variant_id, _)| {
                let variant_data = metadata.get_matching_enum_variant_data(
                    **variant_id,
                    variants.len(),
                );
                variant_data.variant_name.as_deref() == Some("Some")
            })
        {
            if type_ids.len() == 1 {
                let (entry, index) =
                    register_type(registry, schema, type_ids[0]);
                let mut dependencies = entry.dependencies.clone();
                dependencies.insert(index);
                return RegistryEntry {
                    type_hash: TypeHash::create(metadata, kind),
                    type_name: metadata.get_name().map(|s| s.to_string()),
                    schema_kind: TypeScriptSchemaKind::Option {
                        inner_types: vec![index],
                    },
                    dependencies,
                };
            } else {
                let entries: Vec<(RegistryEntry, u32)> = type_ids
                    .iter()
                    .map(|&tid| register_type(registry, schema, tid))
                    .collect();
                let dependencies: HashSet<u32> = entries
                    .iter()
                    .flat_map(|(entry, index)| {
                        let mut deps = entry.dependencies.clone();
                        deps.insert(*index);
                        deps.into_iter()
                    })
                    .collect();
                let indices =
                    entries.into_iter().map(|(_, index)| index).collect();
                return RegistryEntry {
                    type_hash: TypeHash::create(metadata, kind),
                    type_name: metadata.get_name().map(|s| s.to_string()),
                    schema_kind: TypeScriptSchemaKind::Option {
                        inner_types: indices,
                    },
                    dependencies,
                };
            }
        } else {
            panic!("Option enum does not have a Some variant");
        }
    } else {
        // Non‑option enum.
        let variant_entries: Vec<(String, RegistryEntry, u32)> = variants
            .iter()
            .map(|(variant_id, type_ids)| {
                let variant_data = metadata.get_matching_enum_variant_data(
                    *variant_id,
                    type_ids.len(),
                );
                let variant_name =
                    variant_data.variant_name.unwrap_or("<unnamed>");
                if let Some(field_names) = &variant_data.field_names {
                    let fields: Vec<(String, u32, RegistryEntry)> = type_ids
                        .iter()
                        .enumerate()
                        .map(|(i, &tid)| {
                            let (entry, index) =
                                register_type(registry, schema, tid);
                            (field_names[i].to_string(), index, entry)
                        })
                        .collect();
                    let dependencies: HashSet<u32> = fields
                        .iter()
                        .flat_map(|(_, index, entry)| {
                            let mut deps = entry.dependencies.clone();
                            deps.insert(*index);
                            deps.into_iter()
                        })
                        .collect();
                    let fields_indices = fields
                        .into_iter()
                        .map(|(name, index, _)| (name, index))
                        .collect();
                    let entry = RegistryEntry {
                        type_hash: TypeHash::create(metadata, kind),
                        type_name: None,
                        schema_kind: TypeScriptSchemaKind::Struct {
                            fields: fields_indices,
                        },
                        dependencies,
                    };
                    let index = registry.register(&entry);
                    (variant_name.to_string(), entry, index)
                } else {
                    let entries: Vec<(RegistryEntry, u32)> = type_ids
                        .iter()
                        .map(|&tid| register_type(registry, schema, tid))
                        .collect();
                    let dependencies: HashSet<u32> = entries
                        .iter()
                        .flat_map(|(entry, index)| {
                            let mut deps = entry.dependencies.clone();
                            deps.insert(*index);
                            deps.into_iter()
                        })
                        .collect();
                    let indices =
                        entries.into_iter().map(|(_, index)| index).collect();
                    let entry = RegistryEntry {
                        type_hash: TypeHash::create(metadata, kind),
                        type_name: None,
                        schema_kind: TypeScriptSchemaKind::Tuple {
                            fields: indices,
                        },
                        dependencies,
                    };
                    let index = registry.register(&entry);
                    (variant_name.to_string(), entry, index)
                }
            })
            .collect();
        let dependencies: HashSet<u32> = variant_entries
            .iter()
            .flat_map(|(_, entry, index)| {
                let mut deps = entry.dependencies.clone();
                deps.insert(*index);
                deps.into_iter()
            })
            .collect();
        let variant_indices = variant_entries
            .into_iter()
            .map(|(name, _, index)| (name, index))
            .collect();
        RegistryEntry {
            type_hash: TypeHash::create(metadata, kind),
            type_name: metadata.get_name().map(|s| s.to_string()),
            schema_kind: TypeScriptSchemaKind::Enum {
                variants: variant_indices,
            },
            dependencies,
        }
    }
}

/// The recursive function to generate an IR registry entry from a sbor type.
fn create_entry(
    registry: &mut SchemaRegistry,
    schema: &Schema<ScryptoCustomSchema>,
    metadata: &TypeMetadata,
    kind: &TypeKind<ScryptoCustomTypeKind, LocalTypeId>,
    type_id: LocalTypeId,
) -> RegistryEntry {
    match kind {
        TypeKind::Tuple { field_types } => {
            handle_tuple(field_types, registry, schema, metadata, kind)
        }
        TypeKind::Custom(custom) => handle_custom(custom, metadata, kind),
        TypeKind::Array { element_type } => {
            handle_array(*element_type, registry, schema, metadata, kind)
        }
        TypeKind::Enum { variants } => {
            handle_enum(variants, registry, schema, metadata, kind)
        }
        TypeKind::Map {
            key_type,
            value_type,
        } => {
            handle_map(*key_type, *value_type, registry, schema, metadata, kind)
        }
        TypeKind::Bool
        | TypeKind::U8
        | TypeKind::U16
        | TypeKind::U32
        | TypeKind::U64
        | TypeKind::U128
        | TypeKind::I8
        | TypeKind::I16
        | TypeKind::I32
        | TypeKind::I128 => RegistryEntry {
            type_hash: TypeHash::create(metadata, kind),
            type_name: metadata.get_name().map(|s| s.to_string()),
            schema_kind: TypeScriptSchemaKind::Number,
            dependencies: HashSet::new(),
        },
        TypeKind::I64 => {
            // If the integer is of the well known Instant type, we would like to use s.insant() for it.
            if type_id
                == LocalTypeId::WellKnown(
                    well_known_scrypto_custom_types::INSTANT_TYPE,
                )
            {
                RegistryEntry {
                    type_hash: TypeHash::create(metadata, kind),
                    type_name: metadata.get_name().map(|s| s.to_string()),
                    schema_kind: TypeScriptSchemaKind::Instant,
                    dependencies: HashSet::new(),
                }
            } else {
                RegistryEntry {
                    type_hash: TypeHash::create(metadata, kind),
                    type_name: metadata.get_name().map(|s| s.to_string()),
                    schema_kind: TypeScriptSchemaKind::Number,
                    dependencies: HashSet::new(),
                }
            }
        }
        TypeKind::String => RegistryEntry {
            type_hash: TypeHash::create(metadata, kind),
            type_name: metadata.get_name().map(|s| s.to_string()),
            schema_kind: TypeScriptSchemaKind::String,
            dependencies: HashSet::new(),
        },
        TypeKind::Any => RegistryEntry {
            type_hash: TypeHash::create(metadata, kind),
            type_name: metadata.get_name().map(|s| s.to_string()),
            schema_kind: TypeScriptSchemaKind::Value,
            dependencies: HashSet::new(),
        },
    }
}

/// Gets a type by index from a given schema.
fn get_type_by_index(
    schema: &Schema<ScryptoCustomSchema>,
    index: u32,
) -> Option<(TypeMetadata, LocalTypeKind<ScryptoCustomSchema>)> {
    schema
        .type_metadata
        .get(index as usize)
        .and_then(|metadata| {
            schema
                .type_kinds
                .get(index as usize)
                .map(|kind| (metadata.clone(), kind.clone()))
        })
}

// Generates the IR registry from a list of schemas.
pub fn generate_ir(schemas: &[BlueprintWithSchema]) -> SchemaRegistry {
    let mut registry = SchemaRegistry::new();
    let mut main_vars = Vec::new();
    let mut schemas = schemas.to_vec();
    schemas.reverse();

    for schema in schemas {
        let schema_deserialized: Schema<ScryptoCustomSchema> =
            scrypto_decode(&schema.schema.schema)
                .expect("Failed to decode schema");

        let mut types = schema.blueprint.events.clone();
        types.push(schema.blueprint.state.clone());

        for type_data in types {
            if let Some((metadata, _kind)) =
                get_type_by_index(&schema_deserialized, type_data.type_id)
            {
                let type_id =
                    LocalTypeId::SchemaLocalIndex(type_data.type_id as usize);
                let var = registry.get_or_register(
                    &schema_deserialized,
                    &metadata,
                    &schema_deserialized
                        .resolve_type_kind(LocalTypeId::SchemaLocalIndex(
                            type_data.type_id as usize,
                        ))
                        .unwrap(),
                    type_id,
                );
                let hash = var.0.type_hash.clone();
                if !main_vars.contains(&hash) {
                    main_vars.push(hash);
                }
            }
        }
    }
    registry
}
