import React from 'react';
import CIcon from '@coreui/icons-react';
import {
  cilArrowLeft,
  cilArrowRight,
  cilCheck,
  cilCircle,
  cilExternalLink,
  cilHome,
  cilMagnifyingGlass,
  cilMediaPlay,
  cilPencil,
  cilPlus,
  cilReload,
  cilTrash,
  cilX,
} from '@coreui/icons';

const icons = {
  arrowLeft: cilArrowLeft,
  arrowRight: cilArrowRight,
  check: cilCheck,
  circle: cilCircle,
  externalLink: cilExternalLink,
  home: cilHome,
  magnifyingGlass: cilMagnifyingGlass,
  mediaPlay: cilMediaPlay,
  pencil: cilPencil,
  plus: cilPlus,
  reload: cilReload,
  trash: cilTrash,
  x: cilX,
};

export default function DemoIcon({ name, className = '' }) {
  return <CIcon customClassName={`demo-icon${className ? ` ${className}` : ''}`} icon={icons[name]} aria-hidden="true" focusable="false" />;
}
