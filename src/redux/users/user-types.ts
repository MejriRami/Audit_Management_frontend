import { Dispatch } from "@reduxjs/toolkit";

export type GetAuditors = (
    dispatch: Dispatch<any>
) => Promise<boolean>;
