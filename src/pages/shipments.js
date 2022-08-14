import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Spinner, Table, Modal, Button } from 'react-bootstrap';
import { API_URL, UserStorage } from '../core/constant';
import { FaTrash, FaEye, FaEdit, FaFilter, FaArrowDown, FaArrowUp, FaDownload } from 'react-icons/fa';
import axios from 'axios';
import { JsonToExcel } from "react-json-to-excel";
import DatePicker, { registerLocale } from "react-datepicker";
import tr from 'date-fns/locale/tr';
import ImgsViewer from "react-images-viewer";
import "react-datepicker/dist/react-datepicker.css";
import moment from 'moment';
registerLocale('tr', tr);

export default function Shipments() {
    let history = useHistory();
    const [shipments, setShipments] = useState({ list: [], delete: 0, edit: 0, _wait: true, _errorMessage: '' });
    const initFilter = {
        open: false,
        startDate: '',
        endDate: '',
        customerCode: '',
        customerFullname: '',
        customerPhone: '',
        employeeName: '',
        status: 'wait',
        storeName: 'all',
        deliveryStoreName: 'all'
    }
    const [filter, setFilter] = useState(initFilter);
    const [storeList, setStoreList] = useState([]);
    const [employeeList, setEmployeeList] = useState([]);
    const [deliveryStoreList, setDeliveryStoreList] = useState([]);

    const [deleteModal, setDeleteModal] = useState({ shipmenId: 0, open: false, _wait: false });

    const initDetail = { data: [], modalShow: false, _wait: false, _errorMessage: '' }
    const [detail, setDetail] = useState(initDetail);

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

    useEffect(() => {
        axios.get(API_URL + '?p=shipments&filter=' + (UserStorage().isManager === 'Evet' ? 'all' : UserStorage().storeCode)).then((resp) => {
            if (resp.data.status === 'success') {
                setShipments({ ...shipments, _wait: false, list: resp.data.shipments, delete: resp.data.delete, edit: resp.data.edit });
                //#region Store Name Unique
                let tmpStoreNames = [];
                resp.data.shipments.map((item) => {
                    tmpStoreNames = [...tmpStoreNames, item.sMagazaAdi];
                });

                setStoreList(arrayUnique(tmpStoreNames));
                //#endregion

                //#region Employee Name Unique
                let tmpEmployeeNames = [];
                resp.data.shipments.map((item) => {
                    tmpEmployeeNames = [...tmpEmployeeNames, item.TeslimatciAdi];
                });

                setEmployeeList(arrayUnique(tmpEmployeeNames));
                //#endregion

                //#region Delivery Store Name Unique
                let tmpDeliveryStoreNames = [];
                resp.data.shipments.map((item) => {
                    tmpDeliveryStoreNames = [...tmpDeliveryStoreNames, item.DepoAdi];
                });

                setDeliveryStoreList(arrayUnique(tmpDeliveryStoreNames));
                //#endregion
            }
            else {
                setShipments({ ...shipments, _wait: false, _errorMessage: 'Bir sorun oluştu, lütfen tekrar deneyin!' });
            }
        }).catch((error) => {
            setShipments({ ...shipments, _wait: false, _errorMessage: 'Bir sorun oluştu, lütfen tekrar deneyin!' });

        });

    }, []);

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

    const handleDelete = () => {
        setDeleteModal({ ...deleteModal, _wait: true });

        axios.get(API_URL + '?p=shipment-delete&id=' + deleteModal.shipmenId).then((resp) => {
            setDeleteModal({ ...deleteModal, _wait: false, open: false });

            let tmpShipments = shipments.list.filter((item) => item.id !== deleteModal.shipmenId);
            setShipments({ ...shipments, list: tmpShipments });
        }).catch((error) => {
            setDeleteModal({ ...deleteModal, _wait: false });
            alert("Bir sorun oluştu, lütfen tekrar deneyin!");
        })
    }

    const handleDetailShow = (orderId, order) => {
        setDetail({ ...detail, modalShow: true, _wait: true });

        axios.get(API_URL + '?p=order-detail&id=' + orderId).then((resp) => {
            console.log(resp.data)
            if (resp.data.status === 'success') {
                setDetail({
                    ...detail,
                    modalShow: true,
                    _wait: false,
                    _errorMessage: '',
                    data: {
                        orderId,
                        customerCode: order.lKodu,
                        smsCode: order.SmsKodu,
                        status: order.Durum,
                        photo: resp.data.photo,
                        deliveryStoreName: order.DepoAdi,
                        detail: order.TeslimatciAciklama || 'Açıklama Yapılmamış',
                        personelDetail: order.Aciklama || 'Açıklama Yapılmamış',
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

    const [sort, setSort] = useState({ status: 'up', index: -1, defaultData: null });

    const handleTableSort = (index, key) => {
        if (index === sort.index) {
            setSort({ ...sort, status: sort.status === 'up' ? 'down' : 'up' });

            if (sort.status === 'up') {

                let tmpData = [];
                shipments.list.map((item, ind) => {
                    tmpData = [...tmpData, item[key]];
                });

                if (arrayUnique(tmpData).length > 1) {
                    let sortedData = sortByKey(shipments.list, key);
                    setShipments({ ...shipments, list: sortedData.reverse() })
                }
            }
            else {
                let sortedData = sortByKey(shipments.list, key);
                setShipments({ ...shipments, list: sortedData })
            }
        }
        else {
            setSort({ ...sort, status: 'up', index, defaultData: shipments.list });

            let sortedData = sortByKey(shipments.list, key);
            setShipments({ ...shipments, list: sortedData })
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

    const FilterAllTable = (data) => {
        let tmpData = [];
        data.map((item, index) => {
            //#region Filter
            if (!FilterDate(item.TeslimatTarihi)) return;
            if (item.lKodu.search(filter.customerCode)) return;
            if (!FilterString(item.MusteriAdSoyad.toLocaleUpperCase('tr-TR'), filter.customerFullname)) return;
            if ((item.sGSM === null && filter.customerPhone) || item.sGSM?.search(filter.customerPhone)) return;

            if (filter.employeeName !== "all") {
                if (!FilterString(item.TeslimatciAdi, filter.employeeName)) return;
            }

            if (filter.status !== "all") {
                if (filter.status === "wait") {
                    if (item.Durum === "1") return;
                }
                else {
                    if (item.Durum === "0") return;
                }
            }

            if (filter.storeName !== "all") {
                if (!FilterString(item.sMagazaAdi, filter.storeName)) return;
            }

            if (filter.deliveryStoreName !== "all") {
                if (!FilterString(item.DepoAdi, filter.deliveryStoreName)) return;
            }

            //#endregion

            tmpData = [...tmpData, item]
        })

        return tmpData;
    }


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

    const [tableJson, setTableJson] = useState(TableToJson('shipments', [0, 1, 2, 3, 4, 5, 6, 7]))

    useEffect(() => {
        setTableJson(TableToJson('shipments', [0, 1, 2, 3, 4, 5, 6, 7, 8]))
    }, [shipments, filter])

    return (
        <div className='container-fluid mt-2'>
            {shipments._wait ? (
                <center><Spinner animation="border" variant="primary" style={{ marginTop: 50 }} /></center>
            ) : (
                shipments._errorMessage ? (
                    <center><p style={{ marginTop: 50 }}>{shipments._errorMessage}</p></center>
                ) : (
                    <React.Fragment>
                        <div className='col-12'>
                            <button className="btn btn-warning btn-sm" onClick={() => setFilter({ ...initFilter, open: !filter.open })}><FaFilter /> Filtrele</button>
                            <div style={{ float: 'left', marginRight: 20 }}>
                                <JsonToExcel
                                    title={<React.Fragment><FaDownload />  Dışarı Aktar </React.Fragment>}
                                    data={tableJson}
                                    fileName={'sevkiyatlar_' + moment().format('DD/MM/YYYY')}
                                    btnClassName="btn btn-success btn-sm"
                                    btnColor="#198754"
                                />
                            </div>
                        </div>
                        {filter.open ? (
                            <div className='col-12 mt-2 p-3' style={{ border: '1px solid #cccaca', borderRadius: 3 }}>
                                <div className='row'>
                                    <div className='col-12 col-md-4'>
                                        <div className='row'>
                                            <div className='col-12 col-md-6'>
                                                <div className='form-group'>
                                                    <label id="title">Başlangıç Tarihi</label>
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
                                            <div className='col-12 col-md-6'>
                                                <div className='form-group'>
                                                    <label id="title">Bitiş Tarihi</label>
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
                                    <div className='col-12 col-md-4'>
                                        <div className='form-group'>
                                            <label id="title">Müşteri Kodu</label>
                                            <input
                                                className='form-control form-control-sm mt-1'
                                                value={filter.customerCode}
                                                onChange={(e) => setFilter({ ...filter, customerCode: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className='col-12 col-md-4'>
                                        <div className='form-group'>
                                            <label id="title">Müşteri Adı Soyadı</label>
                                            <input
                                                className='form-control form-control-sm mt-1'
                                                value={filter.customerFullname}
                                                onChange={(e) => setFilter({ ...filter, customerFullname: e.target.value.toLocaleUpperCase('tr-TR') })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className='row'>
                                    <div className='col-12 col-md-4'>
                                        <div className='form-group mt-2'>
                                            <label id="title">Müşteri Telefon</label>
                                            <input
                                                className='form-control form-control-sm mt-1'
                                                value={filter.customerPhone}
                                                onChange={(e) => setFilter({ ...filter, customerPhone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className='col-12 col-md-4'>
                                        <div className='form-group mt-2'>
                                            <label id="title">Sevkiyatçı Adı Soyadı</label>
                                            <select className='form-select form-select-sm mt-1' onChange={(e) => setFilter({ ...filter, employeeName: e.target.value })}>
                                                <option value='all' selected={filter.employeeName === 'all'}>Tümü</option>
                                                {employeeList.map((item, index) => {
                                                    return (
                                                        <option value={item} key={index}>{item}</option>
                                                    )
                                                })}
                                            </select>
                                        </div>
                                    </div>
                                    <div className='col-12 col-md-4'>
                                        <div className='form-group mt-2'>
                                            <label id="title">Sevkiyat Durumu</label>
                                            <select className='form-select form-select-sm mt-1' onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
                                                <option value='all'>Tümü</option>
                                                <option value='wait' selected={filter.status === 'wait'}>Bekliyor</option>
                                                <option value='success'>Tamamlandı</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className='row'>
                                    <div className='col-12 col-md-4'>
                                        <div className='form-group mt-2'>
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
                                    <div className='col-12 col-md-4'>
                                        <div className='form-group mt-2'>
                                            <label id="title">Teslimat Yapılacak Depo Adı</label>
                                            <select className='form-select form-select-sm mt-1' onChange={(e) => setFilter({ ...filter, deliveryStoreName: e.target.value })}>
                                                <option value='all' selected={filter.deliveryStoreName === 'all'}>Tümü</option>
                                                {deliveryStoreList.map((item, index) => {
                                                    return (
                                                        <option value={item} key={index}>{item}</option>
                                                    )
                                                })}
                                            </select>
                                        </div>
                                    </div>
                                    <div className='col-12 col-md-4'></div>
                                    {/* <div className='col-12 col-md-4'>
                                        <button className='btn btn-success btn-sm mt-4' style={{ float: 'right' }} onClick={() => setFilter({ ...initFilter, open: true })}>
                                            Filtreyi Temizle
                                        </button>
                                    </div> */}
                                </div>
                            </div>
                        ) : null}
                        <div className='row'>
                            <div className='col-12 mt-2 mb-5' style={{ textAlign: 'center' }}>
                                <div className='overflow-auto' style={{ maxHeight: 250 }}>
                                    <Table responsive bordered hover className='responsive-table' size="sm" data-sticky-header={true} id="shipments">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th onClick={() => handleTableSort(0, 'sMagazaAdi')}>Mağaza Adı {GetSortStatus(0)}</th>
                                                <th onClick={() => handleTableSort(1, 'lKodu')}>Müşteri Kodu {GetSortStatus(1)}</th>
                                                <th onClick={() => handleTableSort(2, 'MusteriAdSoyad')}>Müşteri Adı Soyadı {GetSortStatus(2)}</th>
                                                <th onClick={() => handleTableSort(3, 'TeslimatciAdi')}>Sevkiyatçı Adı Soyadı {GetSortStatus(3)}</th>
                                                <th onClick={() => handleTableSort(4, 'DepoAdi')}>Depo {GetSortStatus(4)}</th>
                                                <th onClick={() => handleTableSort(5, 'TeslimatTarihi')}>Teslim Tarihi {GetSortStatus(5)}</th>
                                                <th onClick={() => handleTableSort(6, 'TamamlanmaTarihi')}>Tamamlanma Tarihi {GetSortStatus(6)}</th>
                                                <th onClick={() => handleTableSort(7, 'Durum')}>Durum {GetSortStatus(7)}</th>
                                                <th>İşlem</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {FilterAllTable(shipments.list).map((item, index) => {
                                                return (
                                                    <tr key={index} className='align-middle'>
                                                        <td onClick={() => handleDetailShow(item.nAlisverisID, item)}>{index + 1}</td>
                                                        <td onClick={() => handleDetailShow(item.nAlisverisID, item)}>{item.sMagazaAdi}</td>
                                                        <td onClick={() => handleDetailShow(item.nAlisverisID, item)}>{item.lKodu}</td>
                                                        <td onClick={() => handleDetailShow(item.nAlisverisID, item)}>{item.MusteriAdSoyad}</td>
                                                        <td onClick={() => handleDetailShow(item.nAlisverisID, item)}>{item.TeslimatciAdi}</td>
                                                        <td onClick={() => handleDetailShow(item.nAlisverisID, item)}>{item.DepoAdi}</td>
                                                        <td onClick={() => handleDetailShow(item.nAlisverisID, item)}>{moment(item.TeslimatTarihi).format('DD/MM/YYYY HH:mm')}</td>
                                                        <td onClick={() => handleDetailShow(item.nAlisverisID, item)}>{item.TamamlanmaTarihi ? moment(item.TamamlanmaTarihi).format('DD/MM/YYYY HH:mm') : '--'}</td>
                                                        <td onClick={() => handleDetailShow(item.nAlisverisID, item)}>{item.Durum === "0" ? 'Bekliyor' : 'Tamamlandı'}</td>
                                                        <td>
                                                            <FaEye
                                                                className="btn-show"
                                                                data-toggle="tooltip"
                                                                data-placement="bottom"
                                                                title="Detayları Görüntüle"
                                                                style={{ fontSize: 15 }}
                                                                onClick={() => handleDetailShow(item.nAlisverisID, item)}
                                                            />
                                                            {shipments.edit === "1" || UserStorage().isManager === 'Evet' ? (
                                                                <FaEdit
                                                                    className={item.Durum === "1" ? 'btn-edit-disabled' : 'btn-edit'}
                                                                    data-toggle="tooltip"
                                                                    data-placement="bottom"
                                                                    title="Düzenle"
                                                                    style={{ fontSize: 15 }}
                                                                    onClick={() => item.Durum === "1" ? null : history.push({ pathname: '/shipment/edit/' + item.id, state: item })}
                                                                />
                                                            ) : null}
                                                            {shipments.delete === "1" || UserStorage().isManager === 'Evet' ? (
                                                                <FaTrash
                                                                    className="btn-delete"
                                                                    data-toggle="tooltip"
                                                                    data-placement="bottom"
                                                                    title="Sil"
                                                                    style={{ fontSize: 15 }}
                                                                    onClick={() => setDeleteModal({ ...deleteModal, shipmenId: item.id, open: true })}
                                                                />
                                                            ) : null}
                                                        </td>
                                                    </tr>
                                                )
                                            })}

                                        </tbody>
                                    </Table>
                                </div>
                                <div className='mt-3' style={{ float: 'right', textAlign: 'right', fontSize: 13, fontWeight: 'bold' }}>
                                    <span>{FilterAllTable(shipments.list).length === shipments.list.length ? null : `Filtrelenen Sevkiyat: ${FilterAllTable(shipments.list).length}`}</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                    <span>Toplam Sevkiyat: {shipments.list.length}</span>
                                </div>
                            </div>
                        </div>
                    </React.Fragment>
                )
            )}
            <Modal show={deleteModal.open} onHide={() => setDeleteModal({ ...deleteModal, open: false })}>
                <Modal.Header>
                    <Modal.Title>Uyarı</Modal.Title>
                </Modal.Header>
                <Modal.Body>Sevkiyatı silmek istediğinize emin misiniz?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setDeleteModal({ ...deleteModal, open: false })} disabled={deleteModal._wait}>
                        İptal
                    </Button>
                    <Button variant="danger" onClick={handleDelete} disabled={deleteModal._wait}>
                        {deleteModal._wait ? 'Siliniyor...' : 'Evet'}
                    </Button>
                </Modal.Footer>
            </Modal>
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
                                <div className='col-12 col-lg-3'>
                                    <div className='form-group mt-2'>
                                        <label>Mağaza Adı</label>
                                        <input
                                            className='form-control form-control-sm mt-1'
                                            value={detail.data.storeName}
                                            disabled
                                        />
                                    </div>
                                    <div className='form-group mt-2'>
                                        <label>SMS Onay Kodu</label>
                                        <input
                                            className='form-control form-control-sm mt-1'
                                            value={detail.data.smsCode || 'Kodsuz Onay'}
                                            disabled
                                        />
                                    </div>
                                    <div className='form-group mt-2'>
                                        <label>Depo Adı</label>
                                        <input
                                            className='form-control form-control-sm mt-1'
                                            value={detail.data.deliveryStoreName}
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div className='col-12 col-lg-3'>
                                    <div className='form-group mt-2'>
                                        <label>Müşteri GSM</label>
                                        <input
                                            className='form-control form-control-sm mt-1'
                                            value={detail.data.phoneNumber}
                                            disabled
                                        />
                                    </div>
                                    <div className='form-group mt-2'>
                                        <label>Sevkiyatçı Açıklama</label>
                                        {/* <input
                                            className='form-control form-control-sm mt-1'
                                            value={detail.data.detail}
                                            disabled
                                        /> */}
                                        <textarea className='form-control form-control-sm mt-1' rows="1" disabled value={detail.data.detail} />
                                    </div>
                                    <div className='form-group mt-2'>
                                        <label>Personel Açıklama</label>
                                        <textarea className='form-control form-control-sm mt-1' rows="1" disabled value={detail.data.personelDetail} />
                                    </div>
                                </div>
                                <div className='col-12 col-lg-6'>
                                    <div className='form-group mt-2'>
                                        <label>Adres</label>
                                        <textarea className='form-control form-control-sm mt-1' disabled value={detail.data.address} />
                                    </div>
                                </div>
                                
                            </div>
                            <div className='row'>

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
                    {detail.data.status === "1" ? (
                        <Button variant="warning" style={{ position: 'absolute', left: 10 }} onClick={() => window.open(detail.data.photo, "_blank")} disabled={!detail.data.photo}>
                            Fotoğrafı Görüntüle
                        </Button>
                    ) : null}
                    <Button variant="primary" onClick={() => setDetail(initDetail)}>
                        Tamam
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}