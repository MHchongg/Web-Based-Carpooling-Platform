import { Fragment } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material"

export default function MyDialog({ myDialog, action, handleMyDialogClose }) {

    return (
        <Fragment>
            <Dialog
                open={myDialog.isShow}
                onClose={handleMyDialogClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title" sx={{ fontWeight: '900', fontSize: '1.5rem' }}>
                    {myDialog.title}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description" sx={{ fontWeight: '900', fontSize: '1.5rem' }}>
                        {myDialog.content}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleMyDialogClose} sx={{ fontWeight: '900' }}>
                        Cancel
                    </Button>
                    <Button onClick={action} autoFocus sx={{ fontWeight: '900' }}>
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </Fragment>
    );
}