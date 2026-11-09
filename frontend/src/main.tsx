import React from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import {GymApp} from './app/gym-app';
import '../app/globals.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter><GymApp/></BrowserRouter></React.StrictMode>);
