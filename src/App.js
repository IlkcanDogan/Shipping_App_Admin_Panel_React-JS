import React from 'react';
import { BrowserRouter as Router, Switch, Redirect } from 'react-router-dom';
import PrivateRoute from './core/privateRoute';
import PublicRoute from './core/publicRoute';
import Pages from './pages';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.scss'

function App() {
  return (
    <Router basename='/sevkiyat'>
      <Switch>
        {Pages.public.map((page) => { return (<PublicRoute exact {...page} />) })}
        {Pages.private.map((page) => { return (<PrivateRoute exact {...page} />) })}
        <Redirect to="/" />
      </Switch>
    </Router>
  );
}
export default App;