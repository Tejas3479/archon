import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/',
    component: ComponentCreator('/', 'e24'),
    routes: [
      {
        path: '/',
        component: ComponentCreator('/', '35c'),
        routes: [
          {
            path: '/',
            component: ComponentCreator('/', '54f'),
            routes: [
              {
                path: '/architecture',
                component: ComponentCreator('/architecture', 'c5a'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/setup',
                component: ComponentCreator('/setup', '11f'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/',
                component: ComponentCreator('/', 'efb'),
                exact: true,
                sidebar: "tutorialSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
