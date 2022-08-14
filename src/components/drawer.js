import React, { useState, useEffect } from 'react';
import {
  ProSidebar,
  Menu,
  MenuItem,
  SidebarHeader,
  SidebarContent,
} from 'react-pro-sidebar';
import { FaList, FaPlus } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';

const Drawer = ({ toggled, handleToggleSidebar }) => {
  let history = useHistory();

  function RoutePage(page) { history.push(page); handleToggleSidebar(); }

  return (
    <ProSidebar
      collapsed={false}
      toggled={toggled}
      breakPoint="md"
      onToggle={handleToggleSidebar}
      style={{ height: 900, scrollBehavior: 'smooth', minWidth: 240 }}
    >
      <SidebarHeader>
        <div
          style={{
            padding: '17px',
            textTransform: 'uppercase',
            fontWeight: 'bold',
            fontSize: 14,
            letterSpacing: '1px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'center'
          }}
        >
          Sevkiyat Yönetim Paneli
        </div>
      </SidebarHeader>

      <SidebarContent>
        <Menu iconShape="circle">
          <MenuItem icon={<FaList />} onClick={() => RoutePage('/shipments')}> Sevkiyatlar </MenuItem>
          <MenuItem icon={<FaPlus />} onClick={() => RoutePage('/shipment/create')}> Sevkiyat Oluştur </MenuItem>
        </Menu>
      </SidebarContent>
    </ProSidebar>
  );
};

export default Drawer;