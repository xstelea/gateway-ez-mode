use schema_gen::ez_mode_gen::generate_ir;
use serde_json::json;
use vercel_runtime::{run, Body, Error, Request, Response, StatusCode};

#[tokio::main]
async fn main() -> Result<(), Error> {
    run(handler).await
}

#[derive(serde::Deserialize)]
struct SchemaGenRequest {
    package_address: String,
    module: Option<bool>,
}

fn error_response(message: &str) -> Response<Body> {
    Response::builder()
        .status(StatusCode::BAD_REQUEST)
        .header("Access-Control-Allow-Origin", "*")
        .header("Content-Type", "application/json")
        .body(json!({ "error": message }).to_string().into())
        .unwrap()
}

pub async fn handler(req: Request) -> Result<Response<Body>, Error> {
    // Handle CORS preflight requests.
    if req.method() == "OPTIONS" {
        return Ok(Response::builder()
            .status(StatusCode::NO_CONTENT)
            .header("Access-Control-Allow-Origin", "*")
            .header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            .header("Access-Control-Allow-Headers", "Content-Type")
            .body(Body::Empty)?);
    }

    let text = String::from_utf8_lossy(req.body());
    let input = serde_json::from_str::<SchemaGenRequest>(&text);
    let input = match input {
        Ok(input) => input,
        Err(_) => {
            return Ok(error_response("Invalid input."));
        }
    };

    let schemas = schema_gen::gateway::get_blueprints_and_corresponding_schemas(
        &input.package_address,
    );
    match schemas {
        Ok(schemas) => {
            let registry = generate_ir(&schemas);
            let schema = registry
                .render(&input.package_address, input.module.unwrap_or(false));
            Ok(Response::builder()
                .status(StatusCode::OK)
                .header("Access-Control-Allow-Origin", "*")
                .header("Content-Type", "application/json")
                .body(json!({ "schema": schema }).to_string().into())?)
        }
        Err(e) => Ok(Response::builder()
            .status(StatusCode::BAD_REQUEST)
            .header("Access-Control-Allow-Origin", "*")
            .header("Content-Type", "application/json")
            .body(json!({ "error": e.to_string() }).to_string().into())?),
    }
}
