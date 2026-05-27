import './index.css';
import { initApp } from './main';

// Initialize the application
initApp().catch(error => {
  console.error('Failed to initialize application:', error);
});
