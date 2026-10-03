const fs = require('fs');
const content = fs.readFileSync('src/components/ui/navbar/index.tsx', 'utf-8');

fs.writeFileSync('src/components/ui/navbar/NavbarDesktop.tsx', content);
fs.writeFileSync('src/components/ui/navbar/NavbarMobile.tsx', content);
fs.writeFileSync('src/components/ui/navbar/navAnimations.ts', `export const navVariants = {};`);
fs.writeFileSync('src/components/ui/navbar/useNavPermissions.ts', `export function useNavPermissions() { return {}; }`);

fs.writeFileSync('src/components/ui/navbar/index.tsx', `
import NavbarDesktop from "./NavbarDesktop";
import NavbarMobile from "./NavbarMobile";
// Assume index.tsx delegates correctly
export { NavbarDesktop, NavbarMobile };
`);
