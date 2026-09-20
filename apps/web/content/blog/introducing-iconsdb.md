---
title: "Introducing IconsDB: 146,000 open source icons, one search box"
description: "Why we built another icon search, how semantic search finds icons by meaning, and what's different from the usual icon explorers."
date: "2026-09-19"
author: "Musthaq"
category: "announcements"
tags: ["announcement"]
---

Every project needs icons, and every project goes through the same ritual: open three or four icon sites, type the same word into each, squint at the results, give up and draw a rectangle. IconsDB is our attempt to end that ritual. It puts **57 open source icon, logo and emoji sets — 146,477 icons — behind one search box**, and it understands what you mean, not just what you type.

## Search by meaning, not by name

Icon names are wildly inconsistent. The "log out" icon is `log-out` in Lucide, `logout` in Tabler, `sign-out` in Phosphor and `exit-to-app` in Material. Plain text search punishes you for not knowing each author's vocabulary.

IconsDB runs two searches at once. A keyword index answers exact and prefix matches instantly in your browser. In parallel, a small sentence-embedding model turns your query into a vector and compares it against every unique icon name, so *"a lady cooking"* finds `woman-cook`, *"notification bell"* finds plain `bell`, and *"delete"* surfaces `trash`. The two lists are blended, and the model runs locally in a Web Worker once it has loaded — nothing you type leaves your machine.

## Variants, grouped

Phosphor ships six weights of every icon; Material Symbols has outlined, rounded and sharp; emoji sets have five skin tones. Showing all of them as separate tiles turns a search for "home" into a wall of near-identical results. IconsDB groups variants into one tile per family (with a count badge) and lets you flip between them in the side panel. Turn grouping off when you want the wall.

## Copy in the format you actually use

Every icon can be copied as inline SVG, a React or Vue component, a Svelte snippet, an Iconify or unplugin-icons reference, a CSS mask, or a data URI — and downloaded as SVG or PNG at any size, in any colour. There's also a [free JSON/SVG API](/api) with the same data.

## Licenses you can see

Each set keeps its original license, shown on every icon. We only include permissive sets (MIT, Apache-2.0, ISC, CC0 and a few CC-BY), flag attribution requirements clearly, and keep a [licenses page](/licenses) with authors and links to the full texts. No GPL, no non-commercial, no surprises in your codebase.

## What's inside

UI sets like Lucide, Heroicons, Tabler, Phosphor, Remix, Material Symbols, Fluent, Carbon, Bootstrap, MingCute and Hugeicons; brand and logo sets including Simple Icons, SVG Logos, Devicon and Font Awesome Brands; file-type icons from VS Code and Catppuccin; three flag sets; and emoji from Twemoji, Noto, Fluent, OpenMoji, EmojiOne and Streamline. Browse them all in the [library](/library).

IconsDB is built on the excellent normalised data that [Iconify](https://iconify.design) maintains, and the site itself is open source. If a set you love is missing, tell us.
