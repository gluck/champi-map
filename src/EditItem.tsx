import React from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Item from './Item'
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';


interface Props {
  item: Item;
  cancel: () => void;
  confirm: (item: Item) => void;
  edit: boolean;
}

interface State {
  item: Item
}

export default class FormDialog extends React.Component<Props, State> {
  constructor(props : Props) {
    super(props)
    this.state = { item: props.item }
  }

  handleClose = () => {
    this.props.cancel()
  };

  handleConfirm = (e : any) => {
    e.preventDefault()
    this.props.confirm(this.state.item)
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
            <DialogTitle id="form-dialog-title">{this.props.edit ? 'Edit item' : 'Create item' }</DialogTitle>
            <DialogContent>
  
              <Select
                    autoFocus
                    value={this.state.item.count}
                    onChange={(e: any) => this.setState({item: {...this.state.item, count: parseInt(e.target.value)}})}
                  >
                    <MenuItem value={1}>1</MenuItem>
                    <MenuItem value={2}>2</MenuItem>
                    <MenuItem value={3}>3</MenuItem>
                    <MenuItem value={4}>4</MenuItem>
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={6}>6</MenuItem>
                    <MenuItem value={7}>7</MenuItem>
                    <MenuItem value={8}>8</MenuItem>
                    <MenuItem value={9}>9</MenuItem>
              </Select>
  
              <Select
                    value={this.state.item.type}
                    onChange={(e: any) => this.setState({item: {...this.state.item, type: e.target.value}})}
                  >
                    <MenuItem value='cepe'>Cepe</MenuItem>
                    <MenuItem value='trompette'>Trompette</MenuItem>
                    <MenuItem value='girolle'>Girolle</MenuItem>
                    <MenuItem value='pied-de-mouton'>Pied de mouton</MenuItem>
                    <MenuItem value='morille'>Morille</MenuItem>
                    <MenuItem value='autre'>Autre</MenuItem>
              </Select>
  
              <TextField
                margin="dense"
                id="notes"
                label="Notes"
                type="text"
                onChange={e => this.setState({item: {...this.state.item, notes: e.target.value}})}
                fullWidth
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={this.handleClose} color="primary">
                Cancel
              </Button>
              <Button onClick={this.handleConfirm} color="primary" type="submit" >
                {this.props.edit ? 'Edit' : 'Create'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </div>
    );
  }
}
