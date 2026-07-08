export function toNodeHandler() {
	return (_req: unknown, _res: unknown, next: () => void) => next();
}
