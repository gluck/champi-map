import React from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

interface Props {
  confirm: (email: string | undefined, password: string | undefined) => void
}

interface State {
  email: string | undefined;
  password: string | undefined;
}

export default class FormDialog extends React.Component<Props, State> {
  handleClose = () => {
    this.props.confirm(undefined, undefined)
  };

  handleConfirm = (e: any) => {
    e.preventDefault()
    this.props.confirm(this.state.email, this.state.password)
  };

  render() {
    return (
      <div>
        <Dialog
          open={true}
          onClose={this.handleClose}
          aria-labelledby="form-dialog-title"
        >
          <form>
            <DialogTitle id="form-dialog-title">Login</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Enter an email/password to store items online
              </DialogContentText>
              <TextField
                autoFocus
                margin="dense"
                id="email"
                label="Email Address"
                type="email"
                onChange={e => this.setState({email: e.target.value})}
                fullWidth
              />
              <TextField
                margin="dense"
                id="password"
                label="Password"
                type="password"
                onChange={e => this.setState({password: e.target.value})}
                fullWidth
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={this.handleClose} color="primary">
                Cancel
              </Button>
              <Button onClick={this.handleConfirm} color="primary" type="submit">
                Login
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </div>
    );
  }
}
