import React, { useState, useEffect } from 'react';
import { useLocation, useHistory } from "react-router-dom";
import { Spinner, Table, Modal, Button } from 'react-bootstrap';
import { API_URL } from '../core/constant';
import { FaEye } from 'react-icons/fa';
import axios from 'axios';
import DatePicker, { registerLocale } from "react-datepicker";
import tr from 'date-fns/locale/tr';
import "react-datepicker/dist/react-datepicker.css";
import moment from 'moment';
registerLocale('tr', tr);

export default function EditShipment() {
    const location = useLocation();
    let history = useHistory();

    useEffect(() => {
        if (!location.state) {
            history.push('/shipments')
        }
    }, [])

    //#region States
    const [orders, setOrders] = useState({ list: [{ ...location.state }], _wait: false, _errorMessage: '' });

    const initDetail = { data: [], modalShow: false, _wait: false, _errorMessage: '' }
    const [detail, setDetail] = useState(initDetail);

    const [shipment, setShipment] = useState({ date: new Date(), employees: [], selectedEmployeeCode: "0", _wait: true, _errorMessage: '' });
    const [stores, setStores] = useState({ list: [], selectedStoreCode: "0", _wait: true, _errorMessage: '' });
    const [form, setForm] = useState({ detail: location.state.Aciklama || '', _wait: false, _errorMessage: '' });

    const [infoModal, setInfoModal] = useState(false);
    //#endregion

    //#region Get Data
    useEffect(() => {
        axios.get(API_URL + '?p=employees').then((resp) => {
            if (resp.data.status === 'success') {
                setShipment({
                    ...shipment,
                    employees: resp.data.employees,
                    _wait: false,
                    selectedEmployeeCode: resp.data.employees.filter((item) => item.TeslimatciAdi === location.state.TeslimatciAdi)[0].TeslimatciKod || "0",
                    date: new Date(location.state.TeslimatTarihi)
                });
            }
            else {
                setShipment({ ...shipment, _wait: false, _errorMessage: 'Bir sorun oluştu. Lütfen tekrar deneyin!' });
            }
        }).catch((error) => {
            setShipment({ ...shipment, _wait: false, _errorMessage: 'Bir sorun oluştu. Lütfen tekrar deneyin!' });
        });
    }, []);

    useEffect(() => {
        axios.get(API_URL + '?p=stores').then((resp) => {
            if (resp.data.status === 'success') {
                setStores({ 
                    ...stores, 
                    list: resp.data.stores,
                    selectedStoreCode: resp.data.stores.filter((item) => item.DepoAdi === location.state.DepoAdi)[0].DepoKodu || "0",
                    _wait: false 
                });
            }
            else {
                setStores({ ...stores, _wait: false, _errorMessage: 'Bir sorun oluştu. Lütfen tekrar deneyin!' });
            }
        }).catch((error) => {
            setStores({ ...stores, _wait: false, _errorMessage: 'Bir sorun oluştu. Lütfen tekrar deneyin!' });
        });
    }, []);

    //#endregion

    //#region Handles
    const handleDetailShow = (orderId, order) => {
        setDetail({ ...detail, modalShow: true, _wait: true });

        axios.get(API_URL + '?p=order-detail&id=' + orderId).then((resp) => {
            if (resp.data.status === 'success') {
                setDetail({
                    ...detail,
                    modalShow: true,
                    _wait: false,
                    _errorMessage: '',
                    data: {
                        customerCode: order.lKodu,
                        customerFullname: order.MusteriAdSoyad,
                        storeName: order.sMagazaAdi,
                        phoneNumber: order.sGSM,
                        address: order.sEvAdresi1 + ' ' + (order.sEvAdresi2 || '') + ' ' + (order.sEvSemt || '') + ' ' + (order.sEvIl || ''),
                        products: resp.data.products
                    }
                });
            }
            else {
                setDetail({ ...detail, modalShow: true, _wait: false, _errorMessage: 'Bir sorun oluştu, lütfen tekrar deneyin!' });
            }
        }).catch((error) => {
            setDetail({ ...detail, _wait: false, modalShow: true, _errorMessage: 'Bir sorun oluştu, lütfen tekrar deneyin!' });
        })
    }

    const handleSelectEmployee = (e) => {
        setShipment({ ...shipment, selectedEmployeeCode: e.target.value });
        setForm({ ...form, _errorMessage: '' });
    }

    const handleSelectStore = (e) => {
        setStores({ ...stores, selectedStoreCode: e.target.value });
        setForm({ ...form, _errorMessage: '' })
    }

    const handleUpdateShipment = () => {
        if (shipment.selectedEmployeeCode !== "0") {
            if (stores.selectedStoreCode !== "0") {
                setForm({ ...form, _wait: true, _errorMessage: '' });
                let formatDate = moment(shipment.date).format('YYYY-MM-DD HH:mm:ss');

                axios.post(API_URL + '?p=shipment-update', {
                    id: location.state.id,
                    date: formatDate,
                    employeeCode: shipment.selectedEmployeeCode,
                    storeCode: stores.selectedStoreCode,
                    detail: form.detail,
                }).then((resp) => {
                    if (resp.data.status === 'success') {
                        setInfoModal(true);
                    }
                    else {
                        setForm({ ...form, _wait: false, _errorMessage: 'Bir sorun oluştu, lütfen tekrar deneyin!' });
                    }
                }).catch((error) => {
                    setForm({ ...form, _wait: false, _errorMessage: 'Bir sorun oluştu, lütfen tekrar deneyin!' });
                })
            }
            else {
                setForm({ ...form, _errorMessage: 'Lütfen depo seçin!' })
            }
        }
        else {
            setForm({ ...form, _errorMessage: 'Lütfen sevkiyatçı seçin!' })
        }
    }
    //#endregion

    return (
        <div className='container mt-2'>
            <div className='row'>
                <div className='col-12'>
                    <span style={{ color: '#000', fontSize: 18 }}>Sipariş</span>
                    <div style={{ borderBottom: '2px solid black' }}></div>
                </div>
            </div>
            <div className='row mt-2'>
                <div className='col-12' style={{ textAlign: 'center' }}>
                    {orders._wait ? (
                        <Spinner animation="border" variant="primary" style={{ marginTop: 50 }} />
                    ) : orders._errorMessage ? (
                        <p style={{ marginTop: 50 }}>{orders._errorMessage}</p>
                    ) : (
                        <div className='overflow-auto' style={{ maxHeight: 200 }}>
                            <Table responsive bordered hover className='responsive-table' size="sm">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Mağaza Adı</th>
                                        <th>Satış Tarihi</th>
                                        <th>Müşteri Kodu</th>
                                        <th>Müşteri Adı Soyadı</th>
                                        <th>Telefon Numarası</th>
                                        <th>Adres</th>
                                        <th>İşlem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.list.map((item, index) => {
                                        return (
                                            <tr key={index} onClick={() => handleDetailShow(item.nAlisverisID, item)}>
                                                <td>{index + 1}</td>
                                                <td>{item.sMagazaAdi}</td>
                                                <td>{moment(item.tarih).format('DD/MM/YYYY')}</td>
                                                <td>{item.lKodu}</td>
                                                <td>{item.MusteriAdSoyad}</td>
                                                <td>{item.sGSM || '--'}</td>
                                                <td>{item.sEvAdresi1} {item.sEvAdresi2} {item.sEvSemt} {item.sEvIl} </td>
                                                <td>
                                                    <FaEye className="btn-show" style={{ fontSize: 15 }} onClick={() => handleDetailShow(item.nAlisverisID, item)} />
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </Table>
                            {!orders.list.length ? (
                                <center><p style={{ marginTop: 10, fontWeight: 'bold' }}>Siparişiniz yok!</p></center>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>
            <div className='row mt-5'>
                <div className='col-12'>
                    <span style={{ color: '#000', fontWeigh: 'bold', fontSize: 18 }}>Sevkiyatı Ayarla</span>
                    <div style={{ borderBottom: '2px solid black' }}></div>
                </div>
            </div>
            <div className='row mt-2'>
                {shipment._wait ? (
                    <center><Spinner animation="border" variant="primary" style={{ marginTop: 50 }} /></center>
                ) : shipment._errorMessage ? (
                    <p style={{ marginTop: 50 }}>{orders._errorMessage}</p>
                ) : (
                    <React.Fragment>
                        <div className="col-12 col-md-3">
                            <div className='form-group mt-2'>
                                <label>Teslim Tarihi</label>
                                <DatePicker
                                    locale="tr"
                                    className='form-control form-control-sm mt-1'
                                    timeInputLabel="Saat:"
                                    dateFormat="dd/MM/yyyy HH:mm"
                                    showTimeInput
                                    withPortal
                                    selected={shipment.date}
                                    onChange={(date) => setShipment({ ...shipment, date })}
                                />
                            </div>
                        </div>
                        <div className="col-12 col-md-3">
                            <div className='form-group mt-2'>
                                <label>Sevkiyatçı Seç</label>
                                <select className='form-select form-select-sm mt-1' onChange={handleSelectEmployee}>
                                    <option value={0}>Seç...</option>
                                    {shipment.employees.map((item, index) => {
                                        return (
                                            <option value={item.TeslimatciKod} key={index} selected={orders.list[0].TeslimatciAdi === item.TeslimatciAdi}>{item.TeslimatciAdi}</option>
                                        )
                                    })}
                                </select>
                            </div>
                        </div>
                        <div className="col-12 col-md-3">
                            <div className='form-group mt-2'>
                                <label>Teslimat Yapılacak Depo Seç</label>
                                <select className='form-select form-select-sm mt-1' onChange={handleSelectStore}>
                                    <option value={0}>Seç...</option>
                                    {stores.list.map((item, index) => {
                                        return (
                                            <option value={item.DepoKodu} key={index} selected={orders.list[0].DepoAdi === item.DepoAdi}>{item.DepoAdi}</option>
                                        )
                                    })}
                                </select>
                            </div>
                        </div>
                        <div className="col-12 col-md-6">
                            <div className='form-group mt-3'>
                                <label>Açıklama</label>
                                <textarea
                                    className='form-control form-select-sm mt-1'
                                    value={form.detail}
                                    onChange={(e) => setForm({ ...form, detail: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className='col-12'>
                            <p className="text-danger mt-1" style={{ fontWeight: 'bold' }}>{form._errorMessage}</p>

                            <button className="btn btn-success" onClick={handleUpdateShipment} disabled={form._wait}>
                                {form._wait ? 'Lütfen bekleyin...' : 'Güncelle'}
                            </button>
                            <button className="btn btn-warning" style={{ marginLeft: 15 }} onClick={() => history.push('/shipments')}>
                                İptal
                            </button>
                        </div>
                    </React.Fragment>
                )}
            </div>
            <Modal size="lg" show={detail.modalShow} onHide={() => setDetail(initDetail)}>
                <Modal.Header>
                    <Modal.Title>Detaylar</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {detail._wait ? (
                        <center>
                            <Spinner animation="border" variant="primary" />
                        </center>
                    ) : (
                        <React.Fragment>
                            <div className='row'>
                                <div className='col-12'>
                                    <span style={{ color: '#000', fontSize: 18 }}>Sevkiyat</span>
                                    <span style={{ color: '#000', fontSize: 18, float: 'right' }}>
                                        {detail.data.customerCode} - {detail.data.customerFullname}
                                    </span>
                                    <div style={{ borderBottom: '2px solid black' }}></div>
                                </div>
                            </div>
                            <div className='row'>
                                <div className='col-12 col-lg-4'>
                                    <div className='form-group mt-2'>
                                        <label>Mağaza Adı</label>
                                        <input
                                            className='form-control form-control-sm mt-1'
                                            value={detail.data.storeName}
                                            disabled
                                        />
                                    </div>
                                    <div className='form-group mt-2'>
                                        <label>Müşteri GSM</label>
                                        <input
                                            className='form-control form-control-sm mt-1'
                                            value={detail.data.phoneNumber}
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div className='col-12 col-lg-8'>
                                    <div className='form-group mt-2'>
                                        <label>Adres</label>
                                        <textarea className='form-control form-control-sm mt-1' disabled value={detail.data.address} />
                                    </div>
                                </div>
                            </div>
                            <div className='row mt-3'>
                                <div className='col-12'>
                                    <span style={{ color: '#000', fontSize: 18 }}>Satış</span>
                                    <div style={{ borderBottom: '2px solid black' }}></div>
                                </div>
                            </div>
                            <div className='row mt-3' style={{ textAlign: 'center' }}>
                                <div className='overflow-auto' style={{ maxHeight: 200 }}>
                                    <Table responsive bordered hover className='responsive-table' size="sm">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Stok Kodu</th>
                                                <th>Ürün Adı</th>
                                                <th>Adet</th>
                                                <th>Kasiyer Adı Soyadı</th>
                                                <th>Satıcı Adı Soyadı</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detail.modalShow && detail.data.products.map((item, index) => {
                                                return (
                                                    <tr key={index}>
                                                        <td>{index + 1}</td>
                                                        <td>{item.sKodu}</td>
                                                        <td>{item.sAciklama}</td>
                                                        <td>{item.lGCMiktar}</td>
                                                        <td>{item.KasiyerAdSoyad}</td>
                                                        <td>{item.SaticiAdSoyad}</td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </Table>
                                </div>
                            </div>
                        </React.Fragment>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={() => setDetail(initDetail)}>
                        Tamam
                    </Button>
                </Modal.Footer>
            </Modal>
            <Modal show={infoModal} onHide={() => setInfoModal(false)}>
                <Modal.Header>
                    <Modal.Title>Bilgi</Modal.Title>
                </Modal.Header>
                <Modal.Body>Sevkiyat başarı ile güncellendi!</Modal.Body>
                <Modal.Footer>
                    <Button variant="success" onClick={() => {
                        setInfoModal(false);
                        history.push('/shipments');
                    }}>
                        Tamam
                    </Button>
                </Modal.Footer>
            </Modal>
        </div >
    )
}