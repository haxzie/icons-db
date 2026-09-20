---
title: "Icon licenses explained: MIT, Apache, CC-BY, CC0 and what they mean for your app"
description: "A practical guide to the licenses used by open source icon sets, what each one requires, and how to stay compliant without a lawyer."
date: "2026-09-18"
author: "Musthaq"
category: "guides"
tags: ["licensing", "guide"]
---

Open source icon sets are free, but "free" comes in flavours. Here's what each common license asks of you when you ship icons in a product.

## The permissive group: MIT, ISC, Apache-2.0, CC0

Used by Lucide (ISC), Heroicons, Tabler, Phosphor, Bootstrap Icons, Fluent, Radix, Octicons (MIT), Material Symbols, Remix Icon, Carbon, MDI (Apache-2.0) and Simple Icons (CC0).

**What you can do:** use the icons in personal and commercial projects, modify them, embed them in apps, websites, native binaries and print.

**What you must do:** if you redistribute the icon *files* themselves (e.g. publishing a package that bundles them), keep the license text and copyright notice with them. Apache-2.0 additionally asks you to note if you changed the files. Rendering icons inside your product does **not** require a visible credit.

CC0 is even simpler — it's a public-domain dedication with no conditions at all.

## Attribution required: CC-BY-4.0

Used by Font Awesome Free, Solar, Twemoji, EmojiOne and Streamline Emojis.

**What you must do:** give credit to the author and link to the license "in any reasonable manner". An entry in your about page, credits screen, README or footer is enough. You do not need to credit on every screen the icon appears.

## Share-alike: CC-BY-SA-4.0

Used by OpenMoji.

Same as CC-BY, plus: if you **modify** the icons and distribute the result, the modified icons must be released under the same license. Using them unchanged in your app is fine and doesn't affect your app's license.

## The ones we skip: GPL and non-commercial

GPL-licensed icon sets (Gridicons, Dashicons, WPF) can require your *own* code to be GPL when icons are combined with it in certain ways. Non-commercial (CC-BY-NC) sets can't be used in a paid product. IconsDB deliberately excludes both so nothing in the catalogue can pull a license into your codebase.

## Logos are different: copyright vs trademark

Brand sets like Simple Icons, SVG Logos and Devicon license the **SVG file**, not the right to use the brand. Using the GitHub logo to link to your GitHub page is normal; using it to imply GitHub endorses your product is not. Follow each brand's usage guidelines — the license badge on IconsDB tells you about the file, not the mark.

## A compliance checklist

1. Check the badge on the icon page. Green means no attribution needed; amber means credit the author.
2. If you bundle icon files in a distributable, include the license text (we link it on every [licenses page](/licenses) row).
3. For CC-BY sets, add one line to your credits: *"Icons by Solar (CC-BY-4.0)"* with a link.
4. For logos, respect the brand's guidelines.

That's genuinely all there is to it for the sets on IconsDB. If a legal team needs the exact terms, every license link goes to the upstream text.
