export interface ChangeDayStatusRequest {
  date: string;    // yyyy-MM-dd
  isClosed: boolean;
}

export interface ChangeDayStatusResponse {
  message: string; // "تم إغلاق اليوم بنجاح ..."
}
