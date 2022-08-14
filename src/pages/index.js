import Login from './login';
import Shipments from './shipments';
import CreateShipment from './createShipment';
import EditShipment from './editShipment';

const Pages = {
    public: [
        {
            restricted: true,
            path: '/',
            title: 'Giriş Yap',
            component: Login
        }
    ],
    private: [
        {   
            title: 'Sevkiyatlar',
            path: '/shipments',
            component: Shipments
        },
        {   
            title: 'Sevkiyat Oluştur',
            path: '/shipment/create',
            component: CreateShipment
        },
        {   
            title: 'Sevkiyatı Düzenle',
            path: '/shipment/edit/:id',
            component: EditShipment
        },
    ]
}

export default Pages;