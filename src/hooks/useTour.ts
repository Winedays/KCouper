import { useCallback } from "react";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

const TOUR_COMPLETED_KEY = "kcouper-tour-completed";
const MOBILE_BREAKPOINT = 1024;

/**
 * Check if the current viewport is mobile
 */
const isMobileViewport = () => window.innerWidth < MOBILE_BREAKPOINT;

/**
 * Tour steps configuration for the walkthrough
 */
const getBaseTourSteps = (): DriveStep[] => [
  {
    element: "[data-tour='hero']",
    popover: {
      title: "歡迎使用 KCouper！",
      description: "這裡會顯示目前可用的優惠券總數，幫你省錢吃肯德基 🍗",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "[data-tour='search']",
    popover: {
      title: "搜尋優惠券",
      description: "輸入關鍵字（如「雞腿」、「蛋撻」）或優惠碼，快速找到想要的優惠",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour='filters']",
    popover: {
      title: "篩選分類",
      description: "點擊分類標籤，只顯示包含特定餐點的優惠券",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour='favorites']",
    popover: {
      title: "收藏功能",
      description: "將常用的優惠券加入收藏，方便下次快速查看",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour='sort']",
    popover: {
      title: "排序方式",
      description: "依價格、折扣幅度或到期日排序，找到最划算的優惠",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: "[data-tour='coupon-card']",
    popover: {
      title: "優惠券卡片",
      description: "點擊優惠碼可複製，點擊「查看餐點選項」看可更換的口味",
      side: "top",
      align: "center",
    },
  },
];

/**
 * Custom hook for managing the onboarding tour
 * Uses driver.js for the walkthrough functionality
 */
export const useTour = () => {
  /**
   * Start the tour walkthrough
   */
  const startTour = useCallback(() => {
    const mobile = isMobileViewport();
    const steps: DriveStep[] = [...getBaseTourSteps()];

    if (mobile) {
      // On mobile, the theme toggle is inside the closed Sheet menu,
      // so show a generic popover without targeting a specific element
      steps.push({
        popover: {
          title: "主題切換",
          description: "點擊右上角的選單按鈕 ☰，即可找到主題切換、導覽等更多功能 👀",
        },
      });
    } else {
      steps.push({
        element: "[data-tour='theme-toggle']",
        popover: {
          title: "主題切換",
          description: "可切換淺色、深色或自動模式，保護你的眼睛 👀",
          side: "left",
          align: "center",
        },
      });
    }

    const driverObj = driver({
      showProgress: true,
      steps,
      nextBtnText: "下一步",
      prevBtnText: "上一步",
      doneBtnText: "完成",
      progressText: "{{current}} / {{total}}",
      allowClose: true,
      overlayColor: "rgba(0, 0, 0, 0.75)",
      popoverClass: "kcouper-tour-popover",
      onDestroyStarted: () => {
        localStorage.setItem(TOUR_COMPLETED_KEY, "true");
        driverObj.destroy();
      },
    });
    driverObj.drive();
  }, []);

  /**
   * Check if the tour should be shown (first-time visitor)
   */
  const shouldShowTour = useCallback(() => {
    return !localStorage.getItem(TOUR_COMPLETED_KEY);
  }, []);

  /**
   * Reset the tour completion status (for testing or manual restart)
   */
  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_COMPLETED_KEY);
  }, []);

  return { startTour, shouldShowTour, resetTour };
};
