/**
 * A field that was expected to be present was missing.
 */
export class MissingFieldError extends Error {
    constructor() {
        super();
    }
}

/**
 * An incorrect address type was provided.
 */
export class IncorrectAddressType extends Error {
    constructor() {
        super();
    }
}

export class NotFoundError extends Error {
    constructor() {
        super();
    }
}

/**
 * An error that occurred while interacting with the Radix Gateway API.
 */
export class GatewayError extends Error {
    constructor(error: Error) {
        super(error.message);
    }
}
