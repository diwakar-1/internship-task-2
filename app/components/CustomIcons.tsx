import React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export const HomeIcon: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 20 20" 
    fill="none" 
    {...props}
  >
    <path opacity="0.34" d="M10 15V12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8.39172 2.35004L2.61672 6.97504C1.96672 7.4917 1.55006 8.58337 1.69172 9.40004L2.80006 16.0334C3.00006 17.2167 4.13339 18.175 5.33339 18.175H14.6667C15.8584 18.175 17.0001 17.2084 17.2001 16.0334L18.3084 9.40004C18.4417 8.58337 18.0251 7.4917 17.3834 6.97504L11.6084 2.35837C10.7167 1.6417 9.27506 1.6417 8.39172 2.35004Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CalendarIcon: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 20 20" 
    fill="none" 
    {...props}
  >
    <path d="M6.66699 1.6665V4.1665" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13.333 1.6665V4.1665" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path opacity="0.4" d="M2.91699 7.5752H17.0837" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17.5 7.08317V14.1665C17.5 16.6665 16.25 18.3332 13.3333 18.3332H6.66667C3.75 18.3332 2.5 16.6665 2.5 14.1665V7.08317C2.5 4.58317 3.75 2.9165 6.66667 2.9165H13.3333C16.25 2.9165 17.5 4.58317 17.5 7.08317Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path opacity="0.4" d="M13.0791 11.4167H13.0866" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path opacity="0.4" d="M13.0791 13.9167H13.0866" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path opacity="0.4" d="M9.99607 11.4167H10.0036" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path opacity="0.4" d="M9.99607 13.9167H10.0036" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path opacity="0.4" d="M6.91209 11.4167H6.91957" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path opacity="0.4" d="M6.91211 13.9165H6.91959" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 20 20" 
    fill="none" 
    {...props}
  >
    <path d="M16.6668 5L7.50016 14.1667L3.3335 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const DoubleCheckIcon: React.FC<IconProps> = ({ size = 100, ...props }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    fill="none" 
    {...props}
  >
    <path d="M94.1149 59.6092C92.1493 56.5517 90.1838 53.6035 88.2183 50.546C87.7815 49.8908 87.7815 49.454 88.2183 48.7989C90.1838 45.8506 92.0401 42.9023 94.0057 39.954C96.2988 36.4598 95.0976 33.0747 91.1666 31.6552C87.8907 30.454 84.6149 29.1437 81.339 27.9425C80.6838 27.7242 80.3562 27.2874 80.3562 26.523C80.247 22.9195 80.0287 19.3161 79.8103 15.8218C79.5919 12 76.6436 9.8161 72.931 10.7989C69.4367 11.6724 65.9425 12.6552 62.5574 13.6379C61.793 13.8563 61.3562 13.6379 60.8103 13.092C58.6264 10.2529 56.3332 7.52299 54.1493 4.79311C51.747 1.73563 48.0344 1.73563 45.5229 4.79311C43.339 7.52299 41.0459 10.2529 38.9712 12.9828C38.4252 13.7471 37.8792 13.8563 37.0057 13.6379C33.6206 12.6552 30.2356 11.7816 27.8333 11.1264C23.1379 10.0345 20.2988 11.8908 20.0804 15.8218C19.862 19.4253 19.6436 23.0287 19.5344 26.7414C19.5344 27.5057 19.2068 27.8333 18.5517 28.1609C15.1666 29.4713 11.7815 30.7816 8.39648 32.092C4.90223 33.5115 3.81028 36.8966 5.88498 40.0632C7.8505 43.1207 9.81602 46.069 11.7815 49.1264C12.2183 49.7816 12.2183 50.2184 11.7815 50.9828C9.70682 54.0402 7.7413 57.0977 5.77578 60.2644C3.91946 63.2127 5.1206 66.7069 8.39646 68.0173C11.7815 69.3276 15.2758 70.6379 18.6608 71.9483C19.4252 72.1667 19.6436 72.6035 19.6436 73.3678C19.7528 76.8621 20.1896 80.2471 20.1896 83.7414C20.1896 87.2357 23.247 90.4023 27.5056 89.092C30.8907 88 34.2757 87.2356 37.6608 86.2529C38.316 86.0345 38.7528 86.1437 39.1895 86.7989C41.4827 89.6379 43.6666 92.3678 45.9597 95.2069C48.4711 98.2644 52.0746 98.2644 54.4769 95.2069C56.77 92.3678 58.9539 89.6379 61.247 86.7989C61.6838 86.2529 62.0114 86.0345 62.7757 86.2529C66.27 87.2356 69.7642 88.1092 73.2585 89.092C76.862 90.0747 79.9194 87.8908 80.0286 84.1782C80.247 80.5747 80.4654 76.9713 80.5746 73.2586C80.5746 72.3851 81.0114 72.0575 81.6665 71.8391C84.9424 70.6379 88.3275 69.3276 91.6033 68.0173C95.0976 66.2701 96.1896 62.7759 94.1149 59.6092ZM68.0172 41.7012L46.1781 63.5402C45.6321 64.0862 44.8677 64.523 44.1034 64.6322C43.885 64.6322 43.5574 64.7414 43.339 64.7414C42.3563 64.7414 41.2643 64.3046 40.4999 63.5402L31.5459 54.5862C30.0172 53.0575 30.0172 50.546 31.5459 49.0172C33.0746 47.4885 35.5861 47.4885 37.1149 49.0172L43.2298 55.1322L62.2298 36.1322C63.7586 34.6035 66.2701 34.6035 67.7988 36.1322C69.5459 37.6609 69.5459 40.1724 68.0172 41.7012Z" fill="currentColor"/>
  </svg>
);

export const UsersIcon: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 20 20" 
    fill="none" 
    {...props}
  >
    <path d="M7.63314 9.05817C7.5498 9.04984 7.4498 9.04984 7.35814 9.05817C5.3748 8.9915 3.7998 7.3665 3.7998 5.3665C3.7998 3.32484 5.4498 1.6665 7.4998 1.6665C9.54147 1.6665 11.1998 3.32484 11.1998 5.3665C11.1915 7.3665 9.61647 8.9915 7.63314 9.05817Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path opacity="0.4" d="M13.6747 3.3335C15.2914 3.3335 16.5914 4.64183 16.5914 6.25016C16.5914 7.82516 15.3414 9.1085 13.7831 9.16683C13.7164 9.1585 13.6414 9.1585 13.5664 9.16683" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3.4666 12.1335C1.44993 13.4835 1.44993 15.6835 3.4666 17.0252C5.75827 18.5585 9.5166 18.5585 11.8083 17.0252C13.8249 15.6752 13.8249 13.4752 11.8083 12.1335C9.52494 10.6085 5.7666 10.6085 3.4666 12.1335Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path opacity="0.4" d="M15.2832 16.6665C15.8832 16.5415 16.4499 16.2998 16.9165 15.9415C18.2165 14.9665 18.2165 13.3582 16.9165 12.3832C16.4582 12.0332 15.8999 11.7998 15.3082 11.6665" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ItineraryIcon: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 20 20" 
    fill="none" 
    {...props}
  >
    <path d="M1.9082 6.48348V14.5918C1.9082 16.1751 3.0332 16.8251 4.39987 16.0418L6.3582 14.9251C6.7832 14.6835 7.49154 14.6585 7.9332 14.8835L12.3082 17.0751C12.7499 17.2918 13.4582 17.2751 13.8832 17.0335L17.4915 14.9668C17.9499 14.7001 18.3332 14.0501 18.3332 13.5168V5.40848C18.3332 3.82514 17.2082 3.17514 15.8415 3.95848L13.8832 5.07514C13.4582 5.31681 12.7499 5.34181 12.3082 5.11681L7.9332 2.93348C7.49154 2.71681 6.7832 2.73348 6.3582 2.97514L2.74987 5.04181C2.2832 5.30848 1.9082 5.95848 1.9082 6.48348Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path opacity="0.4" d="M7.1333 3.3335V14.1668" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path opacity="0.4" d="M13.1084 5.5166V16.6666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const MagicStarIcon: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 21 20" 
    fill="none" 
    {...props}
  >
    <path d="M12.8083 17.5C13.7442 13.6258 14.88 12.4175 18 11.3633C14.7217 10.2567 13.7 8.91333 12.8083 5.2275C11.8717 9.10167 10.735 10.3092 7.615 11.3633C10.89 12.4692 11.9175 13.8217 12.8075 17.5M5.88417 9.31833C6.31083 7.30167 7.13583 6.39167 8.76833 5.90917C7.13583 5.42667 6.31083 4.51667 5.885 2.5C5.47667 4.42917 4.70583 5.40417 3 5.90833C4.6325 6.39167 5.4575 7.30167 5.88417 9.31833Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const MenuIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 28 28" 
    fill="none" 
    {...props}
  >
    <path d="M4 7C4 6.44771 4.44772 6 5 6H24C24.5523 6 25 6.44771 25 7C25 7.55229 24.5523 8 24 8H5C4.44772 8 4 7.55229 4 7Z" fill="currentColor"/>
    <path d="M4 13.9998C4 13.4475 4.44772 12.9997 5 12.9997L16 13C16.5523 13 17 13.4477 17 14C17 14.5523 16.5523 15 16 15L5 14.9998C4.44772 14.9998 4 14.552 4 13.9998Z" fill="currentColor"/>
    <path d="M5 19.9998C4.44772 19.9998 4 20.4475 4 20.9998C4 21.552 4.44772 21.9997 5 21.9997H22C22.5523 21.9997 23 21.552 23 20.9998C23 20.4475 22.5523 19.9998 22 19.9998H5Z" fill="currentColor"/>
  </svg>
);

export const LogoutIcon: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    {...props}
  >
    <path d="M8.90039 7.56023C9.21039 3.96023 11.0604 2.49023 15.1104 2.49023H15.2404C19.7104 2.49023 21.5004 4.28023 21.5004 8.75023V15.2702C21.5004 19.7402 19.7104 21.5302 15.2404 21.5302H15.1104C11.0904 21.5302 9.24039 20.0802 8.91039 16.5402" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path opacity="0.4" d="M14.9991 12H3.61914" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path opacity="0.4" d="M5.85 8.65039L2.5 12.0004L5.85 15.3504" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const PlusIcon: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 21 20" 
    fill="none" 
    {...props}
  >
    <path d="M10.4998 4.1665V15.8332M4.6665 9.99984H16.3332" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const RefreshIcon: React.FC<IconProps> = ({ size = 18, ...props }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 18 18" 
    fill="none" 
    {...props}
  >
    <path d="M1.5 9C1.5 4.86 4.83 1.5 9 1.5C14.0025 1.5 16.5 5.67 16.5 5.67M16.5 5.67V1.92M16.5 5.67H13.17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path opacity="0.4" d="M16.4175 9C16.4175 13.14 13.0575 16.5 8.9175 16.5C4.7775 16.5 2.25 12.33 2.25 12.33M2.25 12.33H5.64M2.25 12.33V16.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ArrowLeftIcon: React.FC<IconProps> = ({ size = 18, ...props }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 17 18" 
    fill="none" 
    {...props}
  >
    <path d="M7.4375 14.3125L2.125 9M2.125 9L7.4375 3.6875M2.125 9L14.875 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ArrowDownIcon: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 20 20" 
    fill="none" 
    {...props}
  >
    <path d="M16.25 6.875L10 13.125L3.75 6.875" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const LocationMarkIcon: React.FC<IconProps> = ({ size = 18, ...props }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 18 18" 
    fill="none" 
    {...props}
  >
    <path opacity="0.4" d="M9.00016 10.0726C10.2925 10.0726 11.3402 9.02492 11.3402 7.73258C11.3402 6.44023 10.2925 5.39258 9.00016 5.39258C7.70781 5.39258 6.66016 6.44023 6.66016 7.73258C6.66016 9.02492 7.70781 10.0726 9.00016 10.0726Z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M2.71527 6.3675C4.19277 -0.127498 13.8153 -0.119998 15.2853 6.375C16.1478 10.185 13.7778 13.41 11.7003 15.405C10.1928 16.86 7.80777 16.86 6.29277 15.405C4.22277 13.41 1.85277 10.1775 2.71527 6.3675Z" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

export const StarIcon: React.FC<IconProps> = ({ size = 19, ...props }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 19 19" 
    fill="none" 
    {...props}
  >
    <path 
      fillRule="evenodd" 
      clipRule="evenodd" 
      d="M4.57396 18.2578L9.3326 15.7735L14.0912 18.2578C14.7762 18.6154 15.5742 18.0332 15.4427 17.2718L14.5353 12.0184L18.38 8.29682C18.9372 7.75755 18.6317 6.81348 17.8643 6.70274L12.5456 5.93527L10.1683 1.15164C9.8251 0.461171 8.84011 0.461171 8.49695 1.15164L6.11957 5.93527L0.800908 6.70274C0.0334911 6.81348 -0.271953 7.75755 0.285159 8.29682L4.12988 12.0184L3.22255 17.2718C3.09104 18.0332 3.88899 18.6154 4.57396 18.2578Z" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);
