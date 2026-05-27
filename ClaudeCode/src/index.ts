import './index.css';
import { initApp } from './main';

initApp().catch(error => {
  console.error('Failed to initialize application:', error);
});