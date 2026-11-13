import React from 'react';
import { Avatar3DChatView } from '../avatar3d/Avatar3DChatView';

/**
 * @deprecated Los avatares fotográficos 2D fueron sustituidos en su totalidad por Avatares 3D Procedurales
 * con Lip-Sync acústico en tiempo real. Este componente actúa como puente hacia Avatar3DChatView.
 */
export const AvatarCanvas = (props) => {
  return <Avatar3DChatView {...props} />;
};

export default AvatarCanvas;
