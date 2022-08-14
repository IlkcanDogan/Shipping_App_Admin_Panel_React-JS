import React, { useState } from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { Link, useHistory } from 'react-router-dom';
import { API_URL } from '../core/constant';
import axios from 'axios';

export default function Login() {
    let history = useHistory();
    const [form, setForm] = useState({ username: '', password: '', _errorMessage: '', _wait: false });

    const handleLogin = () => {
        if (form.storeCode && form.password) {
            setForm({ ...form, _wait: true });

            axios.post(API_URL + '/', {
                storeCode: form.storeCode,
                password: form.password
            }).then((resp) => {
                if (resp.data.status == 'success') {
                    localStorage.setItem('user', JSON.stringify(resp.data));
                    history.push('/shipments');
                }
                else {
                    setForm({ ...form, _wait: false, _errorMessage: 'Mağaza kodu veya parolanız yanlış!' })
                }
            }).catch((error) => {
                console.log(error)
                setForm({ ...form, _wait: false, _errorMessage: 'Bir sorun oluştu. Lütfen tekrar deneyin!' });
            })
        }
        else {
            setForm({ ...form, _errorMessage: 'Lütfen boş bırakmayın!' });
        }
    }

    return (
        <Container className="pt-5">
            <Row className="justify-content-md-center pt-5">
                <Col md="auto" style={{ minWidth: 360, backgroundColor: '#fff', padding: 10, borderRadius: 5, paddingTop: 0, paddingBottom: 30 }}>
                    <img src="./logo.png" className="img-fluid" style={{ height: 60, display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
                    <h4 style={{color: '#000', textAlign: 'center', fontWeight: 'bold'}} className="mt-2 mb-5">Sevkiyat Yönetim Paneli</h4>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Mağaza Kodu</Form.Label>
                            <Form.Control type="text" value={form.storeCode} onChange={(e) => setForm({ ...form, storeCode: e.target.value, _errorMessage: '' })} />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Parola</Form.Label>
                            <Form.Control type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value, _errorMessage: '' })} />

                            <Form.Text className="text-danger" style={{ fontWeight: 'bold' }}>
                                {form._errorMessage}
                            </Form.Text>
                        </Form.Group>
                        <div className="d-grid">
                            <Button variant="primary" disabled={form._wait} type="button" onClick={handleLogin}>
                                {form._wait ? 'Lütfen bekleyin...' : 'Giriş Yap'}
                            </Button>
                        </div>
                    </Form>
                </Col>
            </Row>
        </Container>
    )
}