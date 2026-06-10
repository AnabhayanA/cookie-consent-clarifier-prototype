/**
 * deps.js — centralised CDN imports
 *
 * All other JS files import from here so the CDN URL is only written once.
 * Uses esm.sh which serves npm packages as ES modules.
 */
import { createElement, useState, useEffect } from "https://esm.sh/react@18";
import { createRoot } from "https://esm.sh/react-dom@18/client";
import htm from "https://esm.sh/htm@3";

/** htm bound to React.createElement — use as a tagged template literal: html`<div>…</div>` */
export const html = htm.bind(createElement);

export { createElement, useState, useEffect, createRoot };
