import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { UserStorage } from './constant';

const PublicRoute = ({ component: Component, title, restricted, ...rest }) => {
    document.title = `Sevkiyat Yönetim Paneli ${title ? ' - ' + title : ''}`;
    
    return (
        <Route {...rest} render={props => (
            !!UserStorage() && restricted ?
                <Redirect to="/shipments" />
                : <Component {...props} />
        )} />
    );
};

export default PublicRoute;