import { validateNpmPackage, validateNpmPackages } from '../npm/validateNpmPackage';

export async function runValidateNpmPackageCommand(options: {
  names: string[];
  json?: boolean;
}): Promise<number> {
  const names = options.names.map((name) => name.trim()).filter(Boolean);

  if (names.length === 0) {
    console.error('Usage: viberaven validate-npm-package [--json] <package> [package...]');
    return 1;
  }

  const results =
    names.length === 1
      ? [await validateNpmPackage(names[0])]
      : await validateNpmPackages(names);

  const payload = names.length === 1 ? results[0] : { results };

  if (options.json) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    for (const result of results) {
      console.log(`${result.name}: ${result.verdict}`);
      for (const reason of result.reasons) {
        console.log(`  - ${reason}`);
      }
      console.log(`  followUp: ${result.followUpCommand}`);
    }
  }

  const hasBlocking = results.some((result) => result.verdict !== 'ok');
  return hasBlocking ? 2 : 0;
}
