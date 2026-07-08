import swaggerJsdoc from "swagger-jsdoc";

export const swaggerOptions = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "Restaurant Booker API",
			version: "1.0.0",
			description: "API for managing restaurants",
		},
		components: {
			securitySchemes: {
				cookieAuth: {
					type: "apiKey",
					in: "cookie",
					name: "better-auth.session_token",
				},
			},
			schemas: {
				ErrorResponse: {
					type: "object",
					properties: {
						error: {
							type: "string",
						},
					},
					required: ["error"],
				},
				ValidationErrorResponse: {
					type: "object",
					properties: {
						error: {
							type: "string",
						},
						details: {
							type: "array",
							items: {
								type: "object",
								properties: {
									field: {
										type: "string",
									},
									message: {
										type: "string",
									},
								},
								required: ["field", "message"],
							},
						},
					},
					required: ["error", "details"],
				},
			},
		},
	},
	apis: ["./src/routers/*.ts", "./src/server.ts"],
};

export const swaggerDocs = swaggerJsdoc(swaggerOptions);
