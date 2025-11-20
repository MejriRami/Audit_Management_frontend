import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  ClipboardList,
  FileSearch,
  BookCheck,
  LayoutDashboard,
  ClipboardCheck,
  BarChart2,
  CalendarCheck,
  ListChecks,
} from "lucide-react";

// Assume these icons are imported from an icon library
import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import SidebarWidget from "./SidebarWidget";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  // {
  //   icon: <GridIcon />,
  //   name: "Dashboard",
  //   path: "/",
  //   // subItems: [{ name: "Ecommerce", path: "/", pro: false }],
  // },
  // {
  //   icon: <CalenderIcon />,
  //   name: "Plan for Audit",
  //   path: "/calendar",
  // },
  // {
  //   icon: <UserCircleIcon />,
  //   name: "User Profile",
  //   path: "/profile",
  // },
  // {
  //   name: "Forms",
  //   icon: <ListIcon />,
  //   subItems: [{ name: "Form Elements", path: "/form-elements", pro: false }],
  // },
  {
    name: "Framework",
    icon: <BookCheck className="w-5 h-5" />,
    path: "/framework",
  },
  {
    name: "Questionnaire",
    icon: <ListChecks className="w-5 h-5" />,
    path: "/questionnaire",
  },
  {
    name: "Audits Calendar",
    icon: <CalendarCheck className="w-5 h-5" />,
    path: "/audits-calendar",
  },
  {
    name: "KPI Audits",
    icon: <BarChart2 className="w-5 h-5" />,
    path: "/kpi-audits",
  },
  // {
  //   name: "Pages",
  //   icon: <PageIcon />,
  //   subItems: [
  //     { name: "Blank Page", path: "/blank", pro: false },
  //     { name: "404 Error", path: "/error-404", pro: false },
  //   ],
  // },
];

const othersItems: NavItem[] = [
  {
    icon: <PieChartIcon />,
    name: "Charts",
    subItems: [
      { name: "Line Chart", path: "/line-chart", pro: false },
      { name: "Bar Chart", path: "/bar-chart", pro: false },
    ],
  },
  {
    icon: <BoxCubeIcon />,
    name: "UI Elements",
    subItems: [
      { name: "Alerts", path: "/alerts", pro: false },
      { name: "Avatar", path: "/avatars", pro: false },
      { name: "Badge", path: "/badge", pro: false },
      { name: "Buttons", path: "/buttons", pro: false },
      { name: "Images", path: "/images", pro: false },
      { name: "Videos", path: "/videos", pro: false },
    ],
  },
  {
    icon: <PlugInIcon />,
    name: "Authentication",
    subItems: [
      { name: "Sign In", path: "/signin", pro: false },
      { name: "Sign Up", path: "/signup", pro: false },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => location.pathname === path;
  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group transition-colors duration-300
              ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white font-semibold"
                  : "text-gray-300 hover:bg-gray-100/10 hover:text-white/90 dark:hover:bg-gray-800/50"
              }
              ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }
            `}
            >
              <span
                className={`menu-item-icon-size ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "text-gray-800 dark:text-white"
                    : "text-gray-400 group-hover:text-gray-200"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-gray-700 dark:text-gray-200"
                      : "text-gray-400"
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group transition-colors duration-300
                ${
                  isActive(nav.path)
                    ? "bg-gray-200/50 text-gray-900 dark:bg-gray-800 dark:text-white font-semibold"
                    : "text-gray-300 hover:bg-gray-100/10 hover:text-white/90 dark:hover:bg-gray-800/50"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path)
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-400 group-hover:text-gray-200"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}

          {/* Submenu section */}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item transition-colors duration-300 ${
                        isActive(subItem.path)
                          ? "text-gray-900 bg-gray-200/50 dark:text-white dark:bg-gray-800 font-medium"
                          : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                      }`}
                    >
                      {subItem.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`
    fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 
    bg-gradient-to-b from-[#0584CE] to-[#046EAF]
    dark:from-[#035C91] dark:to-[#023C64]
    text-slate-100 dark:text-slate-200
    border-r border-white/10 dark:border-white/5
    h-screen transition-all duration-300 ease-in-out z-50 
    shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]
    ${
      isExpanded || isMobileOpen
        ? "w-[290px]"
        : isHovered
        ? "w-[290px]"
        : "w-[90px]"
    }
    ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
    lg:translate-x-0
  `}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top / Logo */}
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/" className="font-semibold tracking-tight">
          {isExpanded || isHovered || isMobileOpen ? (
            <span className="text-[22px] text-gray-900 dark:text-white transition-colors duration-300">
              <div className="text-xl font-semibold">
                Track<span className="text-[#F68C1F]">Audit</span>
                <div className="border-b-2 border-white mt-1"></div>{" "}
                {/* White line under the text */}
              </div>
            </span>
          ) : (
            <span className="text-[22px] text-[#F68C1F] font-bold">T</span>
          )}
        </Link>
      </div>

      {/* Main content area */}
      <div className="flex flex-col h-full justify-between">
        {/* Scrollable menu items */}
        <div className="flex-1 flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
          <nav className="mb-6">
            <div className="flex flex-col gap-4">
              <div>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "Menu"
                  ) : (
                    <HorizontaLDots className="size-6" />
                  )}
                </h2>
                {renderMenuItems(navItems, "main")}
              </div>
            </div>
          </nav>
        </div>
        {/* Sidebar widget fixed at bottom */}
        {/* {(isExpanded || isHovered || isMobileOpen) && (
          <div className="mt-4">
            <SidebarWidget />
          </div>
        )} */}
      </div>
    </aside>
  );
};

export default AppSidebar;
