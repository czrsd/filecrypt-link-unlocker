import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import App from './App';
export function render() { return renderToStaticMarkup(<React.StrictMode><App /></React.StrictMode>); }
