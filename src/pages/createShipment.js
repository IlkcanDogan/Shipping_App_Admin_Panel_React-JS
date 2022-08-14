import React, { useState, useEffect } from 'react';
import { Spinner, Table, Modal, Button } from 'react-bootstrap';
import { API_URL, UserStorage } from '../core/constant';
import { FaEye, FaFilter, FaArrowDown, FaArrowUp, FaDownload } from 'react-icons/fa';
import axios from 'axios';
import { JsonToExcel } from "react-json-to-excel";
import DatePicker, { registerLocale } from "react-datepicker";
import tr from 'date-fns/locale/tr';
import "react-datepicker/dist/react-datepicker.css";
import moment from 'moment';
registerLocale('tr', tr);

export default function CreateShipment() {
    //#region States
    const [orders, setOrders] = useState({ list: [], _wait: true, _errorMessage: '' });
    const [selecteds, setSelecteds] = useState([]);

    const initDetail = { data: [], modalShow: false, _wait: false, _errorMessage: '' }
    const [detail, setDetail] = useState(initDetail);

    const [shipment, setShipment] = useState({ date: new Date(), employees: [], selectedEmployeeCode: "0", _wait: true, _errorMessage: '' });
    const [stores, setStores] = useState({ list: [], selectedStoreCode: "0", _wait: true, _errorMessage: '' });
    const [form, setForm] = useState({ detail: '', _wait: false, _errorMessage: '' });

    const [infoModal, setInfoModal] = useState(false);

    const [storeList, setStoreList] = useState([]);
    //#endregion

    function arrayUnique(array) {
        var a = array.concat();
        for (var i = 0; i < a.length; ++i) {
            for (var j = i + 1; j < a.length; ++j) {
                if (a[i] === a[j])
                    a.splice(j--, 1);
            }
        }

        return a;
    }

    //#region Get Data

    useEffect(() => {
        axios.get(API_URL + '?p=orders&filter=' + (UserStorage().isManager === 'Evet' ? 'all' : UserStorage().storeCode)).then((resp) => {
            if (resp.data.status === 'success') {
                setOrders({ ...orders, list: resp.data.orders, _wait: false });

                //#region Store Name Unique
                let tmpStoreNames = [];
                resp.data.orders.map((item) => {
                    tmpStoreNames = [...tmpStoreNames, item.sMagazaAdi];
                });

                setStoreList(arrayUnique(tmpStoreNames));
                //#endregion
            }
            else {
                setOrders({ ...orders, _wait: false, _errorMessage: 'Bir sorun oluştu. Lütfen tekrar deneyin!' });
            }
        }).catch((error) => {
            setOrders({ ...orders, _wait: false, _errorMessage: 'Bir sorun oluştu. Lütfen tekrar deneyin!' });
        });
    }, []);

    useEffect(() => {
        axios.get(API_URL + '?p=employees').then((resp) => {
            if (resp.data.status === 'success') {
                setShipment({ ...shipment, employees: resp.data.employees, _wait: false });
            }
            else {
                setShipment({ ...shipment, _wait: false, _errorMessage: 'Bir sorun oluştu. Lütfen tekrar deneyin!' });
            }
        }).catch((error) => {
            setShipment({ ...shipment, _wait: false, _errorMessage: 'Bir sorun oluştu. Lütfen tekrar deneyin!' });
        });
    }, [])

    useEffect(() => {
        axios.get(API_URL + '?p=stores').then((resp) => {
            if (resp.data.status === 'success') {
                setStores({ ...stores, list: resp.data.stores, _wait: false });
            }
            else {
                setStores({ ...stores, _wait: false, _errorMessage: 'Bir sorun oluştu. Lütfen tekrar deneyin!' });
            }
        }).catch((error) => {
            setStores({ ...stores, _wait: false, _errorMessage: 'Bir sorun oluştu. Lütfen tekrar deneyin!' });
        });
    }, [])

    //#endregion

    //#region Handles

    const handleSelect = (id, status) => {
        if (status) {
            setSelecteds([...selecteds, id])
            setForm({ ...form, _errorMessage: '' });
        }
        else {
            setSelecteds([...selecteds.filter(item => item !== id)])
        }
    }

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
        setForm({ ...form, _errorMessage: '' });
    }
    //#endregion

    //#region Filter
    const initFilter = {
        open: false,
        startDate: '',
        endDate: '',
        customerCode: '',
        customerFullname: '',
        customerPhone: '',
        storeName: 'all'
    }
    const [filter, setFilter] = useState(initFilter);


    const FilterString = (source, find) => {
        let result = source.indexOf(find);

        if (result === 0) {
            return true;
        }
        else if (result < 0) {
            return false;
        }
        else {
            return true;
        }
    }

    const FilterDate = (currentDate) => {
        if (filter.open) {
            if (filter.startDate && filter.endDate) {
                let fStartDate = moment(filter.startDate).format('YYYY-MM-DD HH:mm')
                let fEndDate = moment(filter.endDate).format('YYYY-MM-DD HH:mm')
                let fCurrentDate = moment(currentDate).format('YYYY-MM-DD HH:mm');

                return moment(fCurrentDate).isBetween(fStartDate, fEndDate, undefined, '[]');
            }
            else {
                return true;
            }
        }
        else {
            return true;
        }
    }

    const FilterAllTable = (data) => {
        let tmpData = [];

        data.map((item, index) => {
            //#region Filter
            if (item.lKodu.search(filter.customerCode)) return;
            if (!FilterDate(item.tarih)) return;
            if (!FilterString(item.MusteriAdSoyad.toLocaleUpperCase('tr-TR'), filter.customerFullname)) return;
            if ((item.sGSM === null && filter.customerPhone) || item.sGSM?.search(filter.customerPhone)) return;

            if (filter.storeName !== "all") {
                if (!FilterString(item.sMagazaAdi, filter.storeName)) return;
            }

            //#endregion
            tmpData = [...tmpData, item]
        })

        return tmpData;
    }
    //#endregion

    const handleCreateShipment = () => {
        if (selecteds.length) {
            if (shipment.selectedEmployeeCode !== "0") {
                if (stores.selectedStoreCode !== "0") {
                    setForm({ ...form, _wait: true, _errorMessage: '' });
                    let formatDate = moment(shipment.date).format('YYYY-MM-DD HH:mm:ss');

                    axios.post(API_URL + '?p=shipment-create', {
                        date: formatDate,
                        employeeCode: shipment.selectedEmployeeCode,
                        storeCode: stores.selectedStoreCode,
                        detail: form.detail,
                        orders: selecteds
                    }).then((resp) => {
                        if (resp.data.status === 'success') {
                            setForm({ ...form, _wait: false });


                            let tmpOrders = orders.list;
                            selecteds.forEach(element => {
                                tmpOrders = tmpOrders.filter(item => item.nAlisverisID !== element)

                            });

                            setOrders({ ...orders, list: tmpOrders });
                            setSelecteds([]);
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
                    setForm({ ...form, _errorMessage: 'Lütfen depo seçin!' });
                }
            }
            else {
                setForm({ ...form, _errorMessage: 'Lütfen sevkiyatçı seçin!' })
            }
        }
        else {
            setForm({ ...form, _errorMessage: 'Lütfen sipariş(ler) seçin!' })
        }
    }

    //#region Sort
    const [sort, setSort] = useState({ status: 'up', index: -1, defaultData: null });

    const handleTableSort = (index, key) => {
        if (index === sort.index) {
            setSort({ ...sort, status: sort.status === 'up' ? 'down' : 'up' });

            if (sort.status === 'up') {

                let tmpData = [];
                orders.list.map((item, ind) => {
                    tmpData = [...tmpData, item[key]];
                });

                if (arrayUnique(tmpData).length > 1) {
                    let sortedData = sortByKey(orders.list, key);
                    setOrders({ ...orders, list: sortedData.reverse() })
                }
            }
            else {
                let sortedData = sortByKey(orders.list, key);
                setOrders({ ...orders, list: sortedData })
            }
        }
        else {
            setSort({ ...sort, status: 'up', index, defaultData: orders.list });

            let sortedData = sortByKey(orders.list, key);
            setOrders({ ...orders, list: sortedData })
        }
    }

    function sortByKey(array, key) {
        return array.sort(function (a, b) {
            var x = a[key]; var y = b[key];
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        });
    }

    const GetSortStatus = (index) => {
        if (sort.index === index) {
            if (sort.status === 'up') {
                return <FaArrowUp size={10} style={{ marginLeft: 2, marginTop: -1 }} />
            }
            else {
                return <FaArrowDown size={10} style={{ marginLeft: 2, marginTop: -1 }} />
            }
        }
        else {
            return <FaArrowUp size={10} color="#9c9a9a" style={{ marginLeft: 2, marginTop: -1 }} />
        }
    }
    //#endregion

    const TableToJson = (id, idx) => {
        //idx ==> Get data to index
        try {
            let table = document.getElementById(id);

            let data = [];
            for (var i = 1; i < table.rows.length; i++) {
                var tableRow = table.rows[i];
                var rowData = [];
                for (var j = 0; j < tableRow.cells.length; j++) {
                    rowData.push(tableRow.cells[j].innerHTML);;
                }
                data.push(rowData);
            }

            let dt = [];
            data.map((item, index) => {
                let tmp = {};

                idx.map((ind) => {
                    let title = table.children[0].children[0].children[ind].textContent
                    tmp = { ...tmp, [title]: item[ind] }
                })
                dt = [...dt, tmp]
            })

            return dt;

        }
        catch (err) {
            return []
        }
    }

    const [tableJson, setTableJson] = useState(TableToJson('orders', [0, 2, 3, 4, 5, 6, 7]))

    useEffect(() => {
        setTableJson(TableToJson('orders', [0, 2, 3, 4, 5, 6, 7]))
    }, [orders, filter])

    return (
        <div className='container-fluid mt-2'>
            <div className='row'>
                <div className='col-12'>
                    <span style={{ color: '#000', fontSize: 18, }}>Sipariş Seç {selecteds.length ? `(${selecteds.length})` : null} </span>
                    <button className="btn btn-warning btn-sm" style={{ float: 'right' }} onClick={() => setFilter({ ...initFilter, open: !filter.open })}><FaFilter /> Filtrele</button>
                    <div style={{ float: 'right', marginRight: 20 }}>
                        <JsonToExcel
                            title={<React.Fragment><FaDownload />  Dışarı Aktar </React.Fragment>}
                            data={tableJson}
                            fileName={'siparişler_' + moment().format('DD/MM/YYYY')}
                            btnClassName="btn btn-success btn-sm"
                            btnColor="#198754"
                        />
                    </div>
                    <div style={{ borderBottom: '2px solid black', marginTop: 10 }}></div>
                </div>
            </div>
            <div className='row mt-2'>
                <div className='col-12' style={{ textAlign: 'center' }}>
                    {orders._wait ? (
                        <Spinner animation="border" variant="primary" style={{ marginTop: 50 }} />
                    ) : orders._errorMessage ? (
                        <p style={{ marginTop: 50 }}>{orders._errorMessage}</p>
                    ) : (
                        <React.Fragment>
                            {filter.open ? (
                                <div className='col-12 mb-3 p-3' style={{ border: '1px solid #cccaca', borderRadius: 3, textAlign: 'left' }}>
                                    <div className='row'>
                                        <div className='col-12 col-md-3'>
                                            <div className='form-group'>
                                                <label id="title">Mağaza Adı</label>
                                                <select className='form-select form-select-sm mt-1' onChange={(e) => setFilter({ ...filter, storeName: e.target.value })}>
                                                    <option value='all' selected={filter.storeName === 'all'}>Tümü</option>
                                                    {storeList.map((item, index) => {
                                                        return (
                                                            <option value={item} key={index}>{item}</option>
                                                        )
                                                    })}
                                                </select>
                                            </div>
                                        </div>
                                        <div className='col-12 col-md-3'>
                                            <div className='form-group'>
                                                <label id="title">Müşteri Kodu</label>
                                                <input
                                                    className='form-control form-control-sm mt-1'
                                                    value={filter.customerCode}
                                                    onChange={(e) => setFilter({ ...filter, customerCode: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className='col-12 col-md-3'>
                                            <div className='form-group'>
                                                <label id="title">Müşteri Adı Soyadı</label>
                                                <input
                                                    className='form-control form-control-sm mt-1'
                                                    value={filter.customerFullname}
                                                    onChange={(e) => setFilter({ ...filter, customerFullname: e.target.value.toLocaleUpperCase('tr-TR') })}
                                                />
                                            </div>
                                        </div>
                                        <div className='col-12 col-md-3'>
                                            <div className='form-group'>
                                                <label id="title">Müşteri Telefon</label>
                                                <input
                                                    className='form-control form-control-sm mt-1'
                                                    value={filter.customerPhone}
                                                    onChange={(e) => setFilter({ ...filter, customerPhone: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className='row'>
                                        <div className='col-12 col-md-3 mt-2'>
                                            <div className='form-group'>
                                                <label id="title">Satış Başlangıç Tarihi</label>
                                                <DatePicker
                                                    locale="tr"
                                                    className='form-control form-control-sm mt-1'
                                                    timeInputLabel="Saat:"
                                                    todayButton="Bugün"
                                                    dateFormat="dd/MM/yyyy HH:mm"
                                                    showTimeInput
                                                    withPortal
                                                    selected={filter.startDate}
                                                    onChange={(date) => setFilter({ ...filter, startDate: date })}
                                                />
                                            </div>
                                        </div>
                                        <div className='col-12 col-md-3 mt-2'>
                                            <div className='form-group'>
                                                <label id="title">Satış Bitiş Tarihi</label>
                                                <DatePicker
                                                    locale="tr"
                                                    className='form-control form-control-sm mt-1'
                                                    todayButton="Bugün"
                                                    timeInputLabel="Saat:"
                                                    dateFormat="dd/MM/yyyy HH:mm"
                                                    showTimeInput
                                                    withPortal
                                                    selected={filter.endDate}
                                                    onChange={(date) => setFilter({ ...filter, endDate: date })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                            <div className='row'>
                                <div className='col-12'>
                                    <div className='overflow-auto' style={{ maxHeight: 200 }}>
                                        <Table responsive bordered hover className='responsive-table' size="sm" id="orders">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Seç</th>
                                                    <th onClick={() => handleTableSort(0, 'sMagazaAdi')}>Mağaza Adı {GetSortStatus(0)}</th>
                                                    <th onClick={() => handleTableSort(1, 'tarih')}>Satış Tarihi {GetSortStatus(1)}</th>
                                                    <th onClick={() => handleTableSort(2, 'lKodu')}>Müşteri Kodu {GetSortStatus(2)}</th>
                                                    <th onClick={() => handleTableSort(3, 'MusteriAdSoyad')}>Müşteri Adı Soyadı {GetSortStatus(3)}</th>
                                                    <th onClick={() => handleTableSort(4, 'sGSM')}>Telefon Numarası {GetSortStatus(4)}</th>
                                                    <th onClick={() => handleTableSort(5, 'sEvAdresi1')}>Adres {GetSortStatus(5)}</th>
                                                    <th>İşlem</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {FilterAllTable(orders.list).map((item, index) => {
                                                    return (
                                                        <tr key={index} style={{ backgroundColor: selecteds.filter(i => i === item.nAlisverisID).length ? '#a6daff' : '' }} className='align-middle'>
                                                            <td>{index + 1}</td>
                                                            <td>
                                                                <input type="checkbox" id="chb" className='mt-1' checked={selecteds.filter(i => i === item.nAlisverisID).length} onChange={(e) => handleSelect(item.nAlisverisID, e.target.checked)} />
                                                            </td>
                                                            <td onClick={() => handleDetailShow(item.nAlisverisID, item)}>{item.sMagazaAdi}</td>
                                                            <td onClick={() => handleDetailShow(item.nAlisverisID, item)}>{moment(item.tarih).format('DD/MM/YYYY')}</td>
                                                            <td onClick={() => handleDetailShow(item.nAlisverisID, item)}>{item.lKodu}</td>
                                                            <td onClick={() => handleDetailShow(item.nAlisverisID, item)}>{item.MusteriAdSoyad}</td>
                                                            <td onClick={() => handleDetailShow(item.nAlisverisID, item)}>{item.sGSM || '--'}</td>
                                                            <td onClick={() => handleDetailShow(item.nAlisverisID, item)}>{item.sEvAdresi1} {item.sEvAdresi2} {item.sEvSemt} {item.sEvIl} </td>
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
                                    <div className='mt-2' style={{ float: 'right', textAlign: 'right', fontSize: 13, fontWeight: 'bold' }}>
                                        <span>{FilterAllTable(orders.list).length === orders.list.length ? null : `Filtrelenen Sipariş: ${FilterAllTable(orders.list).length}`}</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                        <span>Toplam Sipariş: {orders.list.length}</span>
                                    </div>
                                </div>
                            </div>
                        </React.Fragment>
                    )}
                </div>
            </div>
            <div className='row mt-4'>
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
                                            <option value={item.TeslimatciKod} key={index}>{item.TeslimatciAdi}</option>
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
                                            <option value={item.DepoKodu} key={index}>{item.DepoAdi}</option>
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

                            <button className="btn btn-success" onClick={handleCreateShipment} disabled={form._wait}>
                                {form._wait ? 'Lütfen bekleyin...' : 'Oluştur'}
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
                <Modal.Body>Sevkiyat başarı ile oluşturuldu!</Modal.Body>
                <Modal.Footer>
                    <Button variant="success" onClick={() => setInfoModal(false)}>
                        Tamam
                    </Button>
                </Modal.Footer>
            </Modal>
        </div >
    )
}