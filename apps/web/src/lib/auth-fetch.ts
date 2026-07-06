export async function authFetch(url: string, method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" = "GET") {
	const token = localStorage.getItem("bearer_token");

	const response = await fetch(url, {
	headers: {
		Authorization: `Bearer ${token}`
	},
	method,
	});

	if (!response.ok) {
		throw new Error(`HTTP error status: ${response.status}, error: ${response.statusText}`);
	}

	const data = await response.json();
	return data;
}