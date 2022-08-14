import React, { useState } from 'react';
import { Navbar, Container, Button, Modal } from 'react-bootstrap';
import { FaBars, FaSignOutAlt } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';

export default function TopBar({ handleToggleSidebar }) {
    let history = useHistory();
    let pageTitle = document.title.split('-')[1];
    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const handleLogout = () => {
        localStorage.removeItem('user');
        history.push('/');
        handleClose()
    }

    return (
        <>
            <Navbar style={{ backgroundColor: '#fff', paddingTop: 13, paddingBottom: 13 }}>
                <Container fluid>
                    <div className="btn-toggle" onClick={() => handleToggleSidebar(true)}>
                        <FaBars />
                    </div>
                    <span style={{fontWeight: 'bold', alignSelf: 'center', fontSize: 19}}>
                        {pageTitle}
                    </span>
                    <Navbar.Toggle />
                    <Navbar.Collapse className="justify-content-end">
                        <Button variant="danger" size="sm" onClick={handleShow}> <FaSignOutAlt /> Çıkış Yap</Button>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
            <hr style={{margin: 0, marginTop: -1}}/>

            <Modal show={show} onHide={handleClose}>
                <Modal.Header>
                    <Modal.Title>Uyarı</Modal.Title>
                </Modal.Header>
                <Modal.Body>Çıkış yapmak istediğinize emin misiniz?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        İptal
                    </Button>
                    <Button variant="success" onClick={handleLogout}>
                        Evet
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}
