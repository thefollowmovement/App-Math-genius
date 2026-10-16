/** Names of the top-level fields a schema rejected, from a failed `safeParse`. */
export function invalidFields(issues: readonly { path: readonly PropertyKey[] }[]): Set<string> {
  return new Set(issues.map((issue) => String(issue.path[0] ?? '')));
}
