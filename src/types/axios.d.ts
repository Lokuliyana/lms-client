// types/axios.d.ts
import "axios";

declare module "axios" {
  export interface AxiosRequestConfig {
    /** Show global loader for this request. Default: true */
    showLoader?: boolean;
  }
}
