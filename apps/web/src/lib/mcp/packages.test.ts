import { describe, expect, it } from "vitest";
import { detectIconPackages, packageImport, setsForPackage } from "@icons-db/core";

describe("package map", () => {
  it.each([
    ["heroicons", "home-solid", "Solid 24x24", 'import { HomeIcon } from "@heroicons/react/24/solid";'],
    ["heroicons", "home-20-solid", "Solid 20x20", 'import { HomeIcon } from "@heroicons/react/20/solid";'],
    ["heroicons", "home", "Outline 24x24", 'import { HomeIcon } from "@heroicons/react/24/outline";'],
    ["lucide", "house", "Outline", 'import { House } from "lucide-react";'],
    ["ph", "sign-out-bold", "Bold", 'import { SignOut } from "@phosphor-icons/react";'],
    ["ri", "home-line", "Line", 'import { RiHomeLine } from "@remixicon/react";'],
    ["tabler", "home-filled", "Filled", 'import { IconHomeFilled } from "@tabler/icons-react";'],
    ["mdi", "home", "Regular", 'import { MdHome } from "react-icons/md";'],
    ["fa6-solid", "house", "Solid", 'import { FaHouse } from "react-icons/fa6";'],
    ["ion", "home", "Regular", 'import { IoHome } from "react-icons/io5";'],
  ])("%s:%s → %s", (prefix, name, style, expected) => {
    expect(packageImport(prefix, name, style, "react")?.code.split("\n")[0]).toBe(expected);
  });

  it("prefers the requested package when given", () => {
    expect(packageImport("mdi", "home", "Regular", "react", "@mdi/js")?.code.split("\n")[0]).toBe('import { mdiHome } from "@mdi/js";');
    expect(packageImport("fa6-solid", "house", "Solid", "react", "@fortawesome/free-solid-svg-icons")?.code).toContain("faHouse");
  });

  it("returns null for sets without a package", () => {
    expect(packageImport("noto", "smile", "Default", "react")).toBeNull();
  });

  it("reverse index", () => {
    expect(setsForPackage("lucide-react")).toEqual(["lucide"]);
    expect(setsForPackage("react-icons")).toContain("bi");
    expect(setsForPackage("nope")).toEqual([]);
  });

  it("detects installed packages", () => {
    const d = detectIconPackages(["react", "lucide-react", "@iconify/react", "unplugin-icons"]);
    expect(d.map((x) => x.npm)).toEqual(["lucide-react", "@iconify/react", "unplugin-icons"]);
    expect(d[0].sets).toEqual(["lucide"]);
    expect(d[1].sets).toEqual(["*"]);
  });
});
